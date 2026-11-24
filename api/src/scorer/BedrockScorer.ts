import { BedrockRuntimeClient, ConverseCommand, type ConverseCommandOutput } from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";
import { config } from "../config";
import { computeMeter } from "../meter";
import type { SkillRubric } from "../rubric";
import type { CriterionScore, CriterionState, Session, SkillRecord } from "../types";
import { mergeCriterionStates } from "./criterionState";
import type { FinalScoreResult, Scorer, TokenUsage, TurnEvaluation } from "./Scorer";

const outputSchema = z.object({
  criterionStates: z.array(z.object({
    criterionId: z.string().min(1),
    status: z.enum(["not_covered", "wrong", "partial", "correct"]),
    evidenceQuote: z.string().max(240)
  })),
  nextProbeCriterionId: z.string().min(1)
});

const finalScoreOutputSchema = z.object({
  criteria: z.array(z.object({
    criterionId: z.string().min(1),
    status: z.enum(["not_covered", "wrong", "partial", "correct"]),
    evidenceQuote: z.string().max(240),
    improveTip: z.string().max(300).optional()
  }))
});

const systemPrompt = [
  "You score a spoken skill teach-back session against a supplied rubric.",
  "Return JSON only. Do not use Markdown or any text outside the JSON object.",
  "Grade only what the candidate said. Never give credit for what the Student agent said.",
  "Give no credit when the candidate only repeats the Student agent's words.",
  "Correct terms without an explanation of why or how are at most partial.",
  "Handle English, Hindi, Kannada, and mixed-language speech.",
  "A criterion status only moves upward from its current status unless the latest candidate turn clearly states a misconception; only then may its status be wrong.",
  "For every criterion, return exactly one status: not_covered, wrong, partial, or correct.",
  "For any status other than not_covered, evidenceQuote must be a short, exact quote from the candidate's own words. Use an empty string only for not_covered.",
  "nextProbeCriterionId must be one of the rubric criterion ids and should name the most useful next topic to probe.",
  'Use this JSON shape: {"criterionStates":[{"criterionId":"...","status":"not_covered|wrong|partial|correct","evidenceQuote":"..."}],"nextProbeCriterionId":"..."}.'
].join("\n");

function finalSystemPromptForLanguage(language: string): string {
  const langName = language === "hi" ? "Hindi" : language === "kn" ? "Kannada" : "English";
  return [
    "You are reviewing a complete skill teach-back session against a rubric.",
    "Return JSON only. No Markdown or text outside the JSON object.",
    "Grade only what the candidate said. Never give credit for what the Student agent said.",
    "No credit for repeating the Student agent's words.",
    "Correct terms without explanation of why or how are at most partial.",
    "Handle English, Hindi, Kannada, and mixed-language speech.",
    "For each criterion, return a final status: not_covered, wrong, partial, or correct.",
    "evidenceQuote: a short exact quote from the candidate's own words. Empty string for not_covered.",
    `improveTip: for any criterion NOT marked correct, write one practical sentence the candidate can act on. Write it in ${langName}. Omit the field entirely for correct criteria.`,
    '{"criteria":[{"criterionId":"...","status":"...","evidenceQuote":"...","improveTip":"..."}]}'
  ].join("\n");
}

function candidateText(session: Session): string {
  return session.transcript.filter((turn) => turn.speaker === "candidate").map((turn) => turn.text).join("\n");
}

function latestCandidateTurn(session: Session): string {
  return session.transcript.filter((turn) => turn.speaker === "candidate").at(-1)?.text ?? "";
}

function textFromResponse(response: ConverseCommandOutput): string {
  return response.output?.message?.content?.flatMap((content) => content.text ? [content.text] : []).join("") ?? "";
}

function tokenUsageFromResponse(response: ConverseCommandOutput): TokenUsage {
  return {
    inputTokens: response.usage?.inputTokens ?? 0,
    outputTokens: response.usage?.outputTokens ?? 0
  };
}

function quotedCandidateText(quote: string, allCandidateText: string): string | undefined {
  const trimmed = quote.trim().replace(/^["\u201c]|["\u201d]$/g, "");
  if (!trimmed) return trimmed;
  const index = allCandidateText.toLocaleLowerCase().indexOf(trimmed.toLocaleLowerCase());
  return index === -1 ? undefined : allCandidateText.slice(index, index + trimmed.length);
}

function parseScoringOutput(text: string, rubric: SkillRubric, allCandidateText: string): { criterionStates: CriterionState[]; nextProbeCriterionId: string } {
  const parsed = outputSchema.parse(JSON.parse(text) as unknown);
  const rubricIds = new Set(rubric.criteria.map((criterion) => criterion.id));
  if (parsed.criterionStates.length !== rubric.criteria.length) throw new Error("Bedrock scoring output must include every rubric criterion.");
  if (new Set(parsed.criterionStates.map((state) => state.criterionId)).size !== parsed.criterionStates.length) throw new Error("Bedrock scoring output repeats a criterion.");
  if (parsed.criterionStates.some((state) => !rubricIds.has(state.criterionId))) throw new Error("Bedrock scoring output includes an unknown criterion.");
  if (!rubricIds.has(parsed.nextProbeCriterionId)) throw new Error("Bedrock scoring output includes an unknown next probe criterion.");

  const criterionStates = parsed.criterionStates.map((state) => {
    const evidenceQuote = quotedCandidateText(state.evidenceQuote, allCandidateText);
    if (state.status !== "not_covered" && !evidenceQuote) {
      throw new Error("Bedrock scoring evidence must quote the candidate's own words.");
    }
    return { ...state, evidenceQuote: evidenceQuote ?? "" };
  });
  return { criterionStates, nextProbeCriterionId: parsed.nextProbeCriterionId };
}

function parseFinalScoreOutput(text: string, rubric: SkillRubric, allCandidateText: string): z.infer<typeof finalScoreOutputSchema> {
  const parsed = finalScoreOutputSchema.parse(JSON.parse(text) as unknown);
  const rubricIds = new Set(rubric.criteria.map((c) => c.id));
  if (parsed.criteria.length !== rubric.criteria.length) throw new Error("Final scoring output must include every rubric criterion.");
  if (new Set(parsed.criteria.map((c) => c.criterionId)).size !== parsed.criteria.length) throw new Error("Final scoring output repeats a criterion.");
  if (parsed.criteria.some((c) => !rubricIds.has(c.criterionId))) throw new Error("Final scoring output includes an unknown criterion.");
  return {
    criteria: parsed.criteria.map((c) => {
      const eq = quotedCandidateText(c.evidenceQuote, allCandidateText);
      if (c.status !== "not_covered" && !eq) throw new Error("Final scoring evidence must quote the candidate's own words.");
      return { ...c, evidenceQuote: eq ?? "" };
    })
  };
}

function statusToScore(status: CriterionState["status"]): number {
  return status === "correct" ? 100 : status === "partial" ? 50 : 0;
}

function statusReason(state: CriterionState): string {
  if (state.evidenceQuote) return "Candidate evidence: " + state.evidenceQuote;
  return state.status === "wrong" ? "The recorded explanation includes a misconception for this topic." : "This topic was not clearly covered in the recorded explanation.";
}

function tooShortRecord(session: Session, rubric: SkillRubric): SkillRecord {
  return {
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
  };
}

export class BedrockScorer implements Scorer {
  private readonly client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({ region: config.awsRegion });
  }

  async evaluateTurn(session: Session, rubric: SkillRubric): Promise<TurnEvaluation> {
    const allCandidateText = candidateText(session);
    const requestBody = JSON.stringify({
      rubric: {
        skill: rubric.skill,
        version: rubric.version,
        criteria: rubric.criteria.map((criterion) => ({
          id: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          whatCorrectCovers: criterion.whatCorrectCovers,
          commonMisconceptions: criterion.commonMisconceptions
        }))
      },
      lastSixTurns: session.transcript.slice(-6).map((turn) => ({ speaker: turn.speaker, text: turn.text })),
      latestCandidateTurn: latestCandidateTurn(session),
      currentCriterionStates: session.criterionStates
    });

    let totalTokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await this.client.send(new ConverseCommand({
        modelId: config.bedrockModelId,
        system: [{ text: systemPrompt }],
        messages: [{ role: "user", content: [{ text: requestBody }] }],
        inferenceConfig: { temperature: 0, maxTokens: 800 }
      }));
      const usage = tokenUsageFromResponse(response);
      totalTokenUsage = {
        inputTokens: totalTokenUsage.inputTokens + usage.inputTokens,
        outputTokens: totalTokenUsage.outputTokens + usage.outputTokens
      };
      try {
        const proposed = parseScoringOutput(textFromResponse(response), rubric, allCandidateText);
        const previousStates = session.criterionStates;
        const criterionStates = mergeCriterionStates(rubric, session.criterionStates, proposed.criterionStates);
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
          nextProbeCriterionId: proposed.nextProbeCriterionId,
          tokenUsage: totalTokenUsage
        };
      } catch (error) {
        if (attempt === 1) throw error;
      }
    }
    throw new Error("Bedrock scoring did not return usable JSON.");
  }

  async finalScore(session: Session, rubric: SkillRubric): Promise<FinalScoreResult> {
    const candidateTurnCount = session.transcript.filter((t) => t.speaker === "candidate").length;
    if (candidateTurnCount < 2) return { record: tooShortRecord(session, rubric) };

    const allCandidateText = candidateText(session);
    const requestBody = JSON.stringify({
      rubric: {
        skill: rubric.skill,
        version: rubric.version,
        criteria: rubric.criteria.map((criterion) => ({
          id: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          whatCorrectCovers: criterion.whatCorrectCovers,
          commonMisconceptions: criterion.commonMisconceptions
        }))
      },
      fullTranscript: session.transcript.map((t) => ({ speaker: t.speaker, text: t.text })),
      currentCriterionStates: session.criterionStates,
      sessionLanguage: session.language
    });

    let totalTokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await this.client.send(new ConverseCommand({
        modelId: config.bedrockModelId,
        system: [{ text: finalSystemPromptForLanguage(session.language) }],
        messages: [{ role: "user", content: [{ text: requestBody }] }],
        inferenceConfig: { temperature: 0, maxTokens: 1500 }
      }));
      const usage = tokenUsageFromResponse(response);
      totalTokenUsage = {
        inputTokens: totalTokenUsage.inputTokens + usage.inputTokens,
        outputTokens: totalTokenUsage.outputTokens + usage.outputTokens
      };
      try {
        const finalOutput = parseFinalScoreOutput(textFromResponse(response), rubric, allCandidateText);
        const criteriaById = new Map(finalOutput.criteria.map((c) => [c.criterionId, c]));
        const scores: CriterionScore[] = rubric.criteria.map((criterion) => {
          const c = criteriaById.get(criterion.id);
          const status = c?.status ?? "not_covered";
          const score = statusToScore(status);
          const evidenceQuote = c?.evidenceQuote ?? "";
          return {
            criterionId: criterion.id,
            label: criterion.name,
            status,
            score,
            evidenceQuote,
            reason: statusReason({ criterionId: criterion.id, status, evidenceQuote }),
            improveTip: status !== "correct" ? c?.improveTip : undefined
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
          },
          tokenUsage: totalTokenUsage
        };
      } catch (error) {
        if (attempt === 1) throw error;
      }
    }
    throw new Error("Bedrock final scoring did not return usable JSON.");
  }
}
