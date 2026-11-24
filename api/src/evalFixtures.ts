import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { loadSkillRubric } from "./rubric";
import { createScorer } from "./scorer/createScorer";
import { initialCriterionStates } from "./scorer/criterionState";
import type { MeterTraceEntry, Session } from "./types";

const fixtureSchema = z.object({
  name: z.string().min(1),
  language: z.enum(["en", "hi", "kn"]),
  turns: z.array(z.object({
    speaker: z.enum(["candidate", "agent"]),
    text: z.string().min(1)
  })).min(1)
});

const fixturesDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

async function run(): Promise<void> {
  const rubric = await loadSkillRubric("excel");
  const scorer = createScorer();
  const files = (await readdir(fixturesDirectory)).filter((file) => file.endsWith(".json")).sort();
  for (const file of files) {
    const fixture = fixtureSchema.parse(JSON.parse(await readFile(resolve(fixturesDirectory, file), "utf8")) as unknown);
    let session: Session = {
      id: "fixture-" + fixture.name,
      skill: rubric.skill,
      language: fixture.language,
      level: "new",
      status: "active",
      understanding: 0,
      stalled: false,
      startedAt: "2026-11-24T00:00:00.000Z",
      updatedAt: "2026-11-24T00:00:00.000Z",
      voiceMode: "mock",
      transcript: [],
      criterionStates: initialCriterionStates(rubric),
      meterTrace: [{ turnIndex: 0, value: 0 }]
    };
    for (const turn of fixture.turns) {
      session = {
        ...session,
        transcript: [...session.transcript, { ...turn, createdAt: session.updatedAt }]
      };
      if (turn.speaker === "candidate") {
        const evaluation = await scorer.evaluateTurn(session, rubric);
        const candidateTurnIndex = session.transcript.filter((t) => t.speaker === "candidate").length;
        const traceEntry: MeterTraceEntry = { turnIndex: candidateTurnIndex, value: evaluation.understanding };
        session = {
          ...session,
          understanding: evaluation.understanding,
          stalled: evaluation.stalled,
          criterionStates: evaluation.criterionStates,
          nextProbeCriterionId: evaluation.nextProbeCriterionId,
          meterTrace: [...session.meterTrace, traceEntry]
        };
      }
    }

    const result = await scorer.finalScore(session, rubric);
    const record = result.record;
    console.log(JSON.stringify({
      fixture: fixture.name,
      understanding: session.understanding,
      total: record.total,
      overallLevel: record.overallLevel,
      tooShort: record.tooShort,
      stalled: session.stalled,
      meterTrace: session.meterTrace,
      scores: record.scores.map((s: { criterionId: string; status: string; score: number; improveTip?: string }) => ({
        criterionId: s.criterionId,
        status: s.status,
        score: s.score,
        improveTip: s.improveTip
      }))
    }, null, 2));
  }
}

void run();
