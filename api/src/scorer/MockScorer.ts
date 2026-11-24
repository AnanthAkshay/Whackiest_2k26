import type { SkillRubric } from "../rubric";
import type { CriterionScore, CriterionState, Session, SkillRecord } from "../types";
import { computeMeter } from "../meter";
import { mergeCriterionStates, meterForCriterionStates, nextProbeFromStates } from "./criterionState";
import type { FinalScoreResult, Scorer, TurnEvaluation } from "./Scorer";

type Status = CriterionState["status"];

function candidateTurns(session: Session): string[] {
  return session.transcript.filter((turn) => turn.speaker === "candidate").map((turn) => turn.text);
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function wordSet(text: string): Set<string> {
  return new Set(text.toLocaleLowerCase().match(/[a-z0-9$]+/g) ?? []);
}

function copiedAgentPrompt(session: Session): boolean {
  const agentTurns = session.transcript.filter((turn) => turn.speaker === "agent").map((turn) => wordSet(turn.text));
  return candidateTurns(session).some((candidate) => {
    const words = wordSet(candidate);
    return agentTurns.some((agentWords) => {
      if (agentWords.size < 6 || words.size < 6) return false;
      const shared = [...agentWords].filter((word) => words.has(word)).length;
      return shared / agentWords.size >= 0.7;
    });
  });
}

function statusForCriterion(id: string, text: string): Status {
  if (id === "cells-ranges-references") {
    if (text.includes("$a$1 is a relative") || text.includes("absolute reference") && text.includes("changes every time")) return "wrong";
    if (text.includes("$a$1") && hasAny(text, ["relative", "absolute", "copy"])) return "correct";
    return hasAny(text, ["relative", "absolute", "reference", "$a$1"]) ? "partial" : "not_covered";
  }
  if (id === "formulas-functions") {
    if (text.includes("formula should start with #") || text.includes("sum is only for text")) return "wrong";
    if (text.includes("=") && hasAny(text, ["sum", "average", "min", "max", "count", "if"])) return "correct";
    return hasAny(text, ["formula", "sum", "average", "min", "max", "count", "if"]) ? "partial" : "not_covered";
  }
  if (id === "worksheets-workbooks-navigation") {
    return hasAny(text, ["worksheet", "workbook", "sheet tab"]) ? "partial" : "not_covered";
  }
  if (id === "formatting-number-formats") {
    const hits = ["currency", "percent", "date", "format", "wrap", "alignment"].filter((word) => text.includes(word)).length;
    return hits >= 2 ? "correct" : hits === 1 ? "partial" : "not_covered";
  }
  if (id === "tables-sorting-filtering") {
    const hits = ["table", "header", "sort", "filter", "total"].filter((word) => text.includes(word)).length;
    return hits >= 3 ? "correct" : hits > 0 ? "partial" : "not_covered";
  }
  if (id === "charts") {
    const hits = ["chart", "label", "title", "select data"].filter((word) => text.includes(word)).length;
    return hits >= 2 ? "correct" : hits > 0 ? "partial" : "not_covered";
  }
  return "not_covered";
}

function proposedStates(session: Session, rubric: SkillRubric): CriterionState[] {
  if (copiedAgentPrompt(session)) return rubric.criteria.map((criterion) => ({ criterionId: criterion.id, status: "not_covered", evidenceQuote: "" }));
  const text = candidateTurns(session).join(" ").toLocaleLowerCase();
  const evidenceQuote = candidateTurns(session).at(-1)?.slice(0, 180) ?? "";
  return rubric.criteria.map((criterion) => {
    const status = statusForCriterion(criterion.id, text);
    return { criterionId: criterion.id, status, evidenceQuote: status === "not_covered" ? "" : evidenceQuote };
  });
}

function statusToScore(status: Status): number {
  return status === "correct" ? 100 : status === "partial" ? 50 : 0;
}

function statusReason(state: CriterionState): string {
  if (state.evidenceQuote) return "Candidate evidence: " + state.evidenceQuote;
  return state.status === "wrong" ? "The recorded explanation includes a misconception for this topic." : "This topic was not clearly covered in the recorded explanation.";
}

const mockImproveTips: Record<string, string> = {
  "worksheets-workbooks-navigation": "Try explaining what happens when you right-click a sheet tab and how renaming a tab differs from renaming the file.",
  "cells-ranges-references": "Try explaining what changes when you copy a formula with a relative reference versus an absolute reference like $A$1.",
  "formulas-functions": "Try walking through how =IF(B2>=50,\"Pass\",\"Fail\") works step by step, including what the equals sign does.",
  "formatting-number-formats": "Try explaining why formatting 0.1 as percentage shows 10%, and how that differs from typing the number 10.",
  "tables-sorting-filtering": "Try explaining the difference between sorting and filtering, and why you should sort the whole table rather than a single column.",
  "charts": "Try explaining how you would choose between a column chart and a line chart depending on what question you want to answer."
};

export class MockScorer implements Scorer {
  async evaluateTurn(session: Session, rubric: SkillRubric): Promise<TurnEvaluation> {
    const previousStates = session.criterionStates;
    const criterionStates = mergeCriterionStates(rubric, session.criterionStates, proposedStates(session, rubric));
    const meter = computeMeter(
      rubric.criteria,
      criterionStates,
      previousStates,
      session.understanding,
      session.transcript
    );
    return {
      understanding: meter.value,
      stalled: meter.stalled,
      coveredCriterionIds: criterionStates.filter((state) => state.status === "partial" || state.status === "correct").map((state) => state.criterionId),
      criterionStates,
      nextProbeCriterionId: nextProbeFromStates(rubric, criterionStates),
      tokenUsage: { inputTokens: 0, outputTokens: 0 }
    };
  }

  async finalScore(session: Session, rubric: SkillRubric): Promise<FinalScoreResult> {
    const candidateTurnCount = session.transcript.filter((t) => t.speaker === "candidate").length;
    if (candidateTurnCount < 2) {
      return {
        record: {
          id: session.id,
          sessionId: session.id,
          skill: session.skill,
          language: session.language,
          rubricVersion: rubric.version,
          total: 0,
          overallLevel: "Starting",
          scores: [],
          meterTrace: session.meterTrace ?? [],
          tooShort: true,
          issuedAt: new Date().toISOString()
        }
      };
    }

    const evaluated = session.criterionStates.length > 0
      ? { criterionStates: session.criterionStates }
      : await this.evaluateTurn(session, rubric);
    const stateById = new Map(evaluated.criterionStates.map((state) => [state.criterionId, state]));
    const scores: CriterionScore[] = rubric.criteria.map((criterion) => {
      const state = stateById.get(criterion.id) ?? { criterionId: criterion.id, status: "not_covered" as const, evidenceQuote: "" };
      const score = statusToScore(state.status);
      return {
        criterionId: criterion.id,
        label: criterion.name,
        status: state.status,
        score,
        evidenceQuote: state.evidenceQuote,
        reason: statusReason(state),
        improveTip: state.status !== "correct" ? (mockImproveTips[criterion.id] ?? "Review this topic and try explaining it in your own words.") : undefined
      };
    });
    const total = Math.round(rubric.criteria.reduce((sum, criterion) => {
      const s = scores.find((sc) => sc.criterionId === criterion.id);
      return sum + criterion.weight * (s?.score ?? 0);
    }, 0));
    return {
      record: {
        id: session.id,
        sessionId: session.id,
        skill: session.skill,
        language: session.language,
        rubricVersion: rubric.version,
        total,
        overallLevel: total >= 75 ? "Ready to practise" : total >= 38 ? "Developing" : "Starting",
        scores,
        meterTrace: session.meterTrace ?? [],
        tooShort: false,
        issuedAt: new Date().toISOString()
      }
    };
  }
}
