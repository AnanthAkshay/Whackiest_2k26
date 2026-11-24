import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSkillRubric } from "./rubric";
import { createScorer } from "./scorer/createScorer";
import { initialCriterionStates } from "./scorer/criterionState";
import { getStore } from "./store/createStore";
import type { MeterTraceEntry, Session, SkillRecord, TranscriptTurn } from "./types";

interface DemoTurnTiming {
  turnIndex: number;
  offsetMs: number;
}

export interface DemoSessionFile {
  session: Session;
  record: SkillRecord;
  timings: DemoTurnTiming[];
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(currentDir, "../../web/public/demo/session.json");

async function createFallbackDemoSession(): Promise<{ session: Session; record: SkillRecord }> {
  const rubric = await loadSkillRubric("excel");
  const scorer = createScorer();
  const now = new Date().toISOString();

  let session: Session = {
    id: "demo-excel-session",
    skill: "excel",
    language: "en",
    level: "new",
    status: "active",
    understanding: 0,
    stalled: false,
    startedAt: now,
    updatedAt: now,
    voiceMode: "mock",
    mockQuestionIndex: 0,
    transcript: [
      {
        speaker: "agent",
        text: "Hi! Can you explain how Excel formulas work, like the SUM function?",
        createdAt: new Date(Date.now() - 60000).toISOString()
      }
    ],
    criterionStates: initialCriterionStates(rubric),
    meterTrace: [{ turnIndex: 0, value: 0 }]
  };

  const sampleCandidateTurns = [
    "The SUM function adds together all values in a range of cells, such as SUM(A1:A10).",
    "If a cell is blank or has text, SUM ignores it automatically and does not show an error.",
    "If you use the plus operator like A1+A2 with text, Excel gives a #VALUE! error instead of ignoring it."
  ];

  for (let i = 0; i < sampleCandidateTurns.length; i++) {
    const candidateText = sampleCandidateTurns[i];
    const candTurn: TranscriptTurn = {
      speaker: "candidate",
      text: candidateText,
      createdAt: new Date(Date.now() - (45000 - i * 15000)).toISOString()
    };
    session.transcript.push(candTurn);
    const evaluation = await scorer.evaluateTurn(session, rubric);
    const candidateTurnIndex = session.transcript.filter((t) => t.speaker === "candidate").length;
    const traceEntry: MeterTraceEntry = { turnIndex: candidateTurnIndex, value: evaluation.understanding };
    session.understanding = evaluation.understanding;
    session.stalled = evaluation.stalled;
    session.criterionStates = evaluation.criterionStates;
    session.nextProbeCriterionId = evaluation.nextProbeCriterionId;
    session.meterTrace.push(traceEntry);

    const followUps = [
      "What happens if one of the cells in that range is empty or has text?",
      "How does using SUM differ from just adding cells with a plus sign?",
      "That explains it clearly! Thank you and goodbye!"
    ];
    session.transcript.push({
      speaker: "agent",
      text: followUps[i],
      createdAt: new Date(Date.now() - (35000 - i * 15000)).toISOString()
    });
  }

  const finalResult = await scorer.finalScore(session, rubric);
  session.status = "complete";
  session.completedAt = new Date().toISOString();
  session.recordId = finalResult.record.id;

  return { session, record: finalResult.record };
}

async function run(): Promise<void> {
  const store = getStore();
  const targetId = process.argv[2];
  let session: Session | undefined;
  let record: SkillRecord | undefined;

  if (targetId) {
    session = await store.getSession(targetId);
    if (!session) {
      console.error(`Session ${targetId} not found in store.`);
      process.exit(1);
    }
    if (session.recordId) {
      record = await store.getCredential(session.recordId);
    }
  } else {
    const sessions = await store.listSessions();
    const completed = sessions.filter((s) => s.status === "complete" && s.recordId);
    for (const cand of completed.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))) {
      const rec = await store.getCredential(cand.recordId!);
      if (rec && !rec.tooShort && rec.total > 0) {
        session = cand;
        record = rec;
        break;
      }
    }
  }

  if (!session || !record) {
    console.log("No completed session found in store; generating a fresh reference session...");
    const generated = await createFallbackDemoSession();
    session = generated.session;
    record = generated.record;
  }

  // Generate realistic turn timings for demo replay (2.5s per turn)
  const timings: DemoTurnTiming[] = session.transcript.map((_turn, index) => ({
    turnIndex: index,
    offsetMs: (index + 1) * 2500
  }));

  const payload: DemoSessionFile = {
    session,
    record,
    timings
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Demo session recorded successfully!`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Session ID: ${session.id}`);
  console.log(`  Skill: ${session.skill}`);
  console.log(`  Turns: ${session.transcript.length}`);
  console.log(`  Total score: ${record.total}`);
}

void run();
