import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSkillRubric } from "../../api/src/rubric";
import { MockScorer } from "../../api/src/scorer/MockScorer";
import { initialCriterionStates } from "../../api/src/scorer/criterionState";
import { LocalFileStore } from "../../api/src/store/LocalFileStore";
import type { Session, SkillRecord, TranscriptTurn } from "../../api/src/types";

interface BluffTranscriptJson {
  id: string;
  name: string;
  group: string;
  description: string;
  turns: { speaker: "agent" | "candidate"; text: string }[];
}

async function ensureSeedSessions(store: LocalFileStore, needed: number): Promise<void> {
  const existing = await store.listSessions();
  const completed = existing.filter((s) => s.status === "complete");
  if (completed.length >= needed) return;

  const toCreate = needed - completed.length;
  console.log(`[reviewer:export] Store has ${completed.length} completed sessions. Seeding ${toCreate} candidate sessions...`);

  const rubric = await loadSkillRubric("excel");
  const scorer = new MockScorer();
  const bluffDir = resolve(process.cwd(), "tests", "bluff", "transcripts");
  const files = (await readdir(bluffDir)).filter((f) => f.endsWith(".json"));

  // Sort genuine transcripts first, then bluffers
  const genuineFiles = files.filter((f) => f.startsWith("genuine-")).sort();
  const blufferFiles = files.filter((f) => f.startsWith("bluffer-")).sort();
  const candidatePool = [...genuineFiles, ...blufferFiles];

  let created = 0;
  for (const filename of candidatePool) {
    if (created >= toCreate) break;
    const filePath = resolve(bluffDir, filename);
    const content = JSON.parse(await readFile(filePath, "utf8")) as BluffTranscriptJson;
    const sessionId = `rev-${content.id}`;

    // Skip if already in store
    if (await store.getSession(sessionId)) continue;

    const transcript: TranscriptTurn[] = content.turns.map((t, idx) => ({
      speaker: t.speaker,
      text: t.text,
      createdAt: new Date(Date.now() - (10 - idx) * 30000).toISOString()
    }));

    let session: Session = {
      id: sessionId,
      skill: "excel",
      language: "en",
      level: "new",
      status: "active",
      understanding: 0,
      stalled: false,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      voiceMode: "mock",
      transcript: [],
      criterionStates: initialCriterionStates(rubric),
      meterTrace: [{ turnIndex: 0, value: 0 }]
    };

    for (const turn of transcript) {
      session = {
        ...session,
        transcript: [...session.transcript, turn],
        updatedAt: turn.createdAt
      };
      if (turn.speaker === "candidate") {
        const evalTurn = await scorer.evaluateTurn(session, rubric);
        const candidateTurnIndex = session.transcript.filter((t) => t.speaker === "candidate").length;
        session = {
          ...session,
          understanding: evalTurn.understanding,
          stalled: evalTurn.stalled,
          criterionStates: evalTurn.criterionStates,
          meterTrace: [...session.meterTrace, { turnIndex: candidateTurnIndex, value: evalTurn.understanding }]
        };
      }
    }

    const finalResult = await scorer.finalScore(session, rubric);
    session = {
      ...session,
      status: "complete",
      completedAt: new Date().toISOString(),
      recordId: sessionId
    };

    await store.saveSession(session);
    await store.saveCredential(finalResult.record);
    created++;
  }
}

export async function exportReviewerSessions(nRequested?: number): Promise<void> {
  const reviewerDir = resolve(process.cwd(), "tests", "reviewer");
  const transcriptsDir = resolve(reviewerDir, "transcripts");
  await mkdir(transcriptsDir, { recursive: true });

  const rubric = await loadSkillRubric("excel");
  const storePath = resolve(process.cwd(), ".data");
  const store = new LocalFileStore(storePath);

  const n = nRequested && nRequested > 0 ? nRequested : 5;
  await ensureSeedSessions(store, n);

  const allSessions = await store.listSessions();
  const completedSessions = allSessions
    .filter((s) => s.status === "complete")
    .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt))
    .slice(0, n);

  if (completedSessions.length === 0) {
    console.error("[reviewer:export] No completed sessions found.");
    return;
  }

  console.log(`[reviewer:export] Exporting ${completedSessions.length} sessions to /tests/reviewer/sessions.csv`);

  // Build CSV header
  // Columns: sessionId, language, rubricVersion, aiTotal, one AI score column per criterion, one blank reviewerScore column per criterion, and a blank reviewerTotal
  const aiScoreCols = rubric.criteria.map((c) => `aiScore_${c.id}`);
  const reviewerScoreCols = rubric.criteria.map((c) => `reviewerScore_${c.id}`);
  const headerCols = [
    "sessionId",
    "language",
    "rubricVersion",
    "aiTotal",
    ...aiScoreCols,
    ...reviewerScoreCols,
    "reviewerTotal"
  ];

  const csvRows: string[] = [headerCols.join(",")];

  for (const session of completedSessions) {
    const record: SkillRecord | undefined = session.recordId
      ? await store.getCredential(session.recordId)
      : undefined;

    const aiTotal = record?.total ?? session.understanding ?? 0;
    const rubricVersion = record?.rubricVersion ?? rubric.version;

    const aiScores = rubric.criteria.map((c) => {
      const match = record?.scores?.find((s) => s.criterionId === c.id);
      return match ? String(match.score) : "0";
    });

    const blankReviewerScores = rubric.criteria.map(() => "");
    const blankReviewerTotal = "";

    const row = [
      session.id,
      session.language,
      rubricVersion,
      String(aiTotal),
      ...aiScores,
      ...blankReviewerScores,
      blankReviewerTotal
    ];
    csvRows.push(row.join(","));

    // Write individual transcript markdown
    const mdContent = `# Candidate Session Transcript: ${session.id}

- **Session ID**: \`${session.id}\`
- **Skill**: \`${session.skill}\`
- **Language**: \`${session.language}\`
- **Rubric Version**: \`${rubricVersion}\`
- **AI Total Score**: **${aiTotal} / 100**
- **Started At**: ${session.startedAt}
- **Completed At**: ${session.completedAt ?? "N/A"}

---

## AI Criterion Scores (Reference)

${rubric.criteria.map((c) => {
  const scoreObj = record?.scores?.find((s) => s.criterionId === c.id);
  const scoreVal = scoreObj ? scoreObj.score : 0;
  return `- **${c.name}** (\`${c.id}\`, weight ${c.weight}): **${scoreVal} / 100**${scoreObj?.reason ? `\n  *AI Note: ${scoreObj.reason}*` : ""}`;
}).join("\n\n")}

---

## Instructions for Human Reviewer
1. Read the dialogue below thoroughly.
2. For each criterion, assign an independent reviewer score (0 = not covered or misconception, 50 = partial understanding, 100 = solid explanation).
3. Compute or assign the overall \`reviewerTotal\` (0 to 100).
4. Record your scores in \`/tests/reviewer/sessions.csv\` under \`reviewerScore_<criterionId>\` and \`reviewerTotal\`.

---

## Dialogue Transcript

${session.transcript.length === 0 ? "*(No transcript recorded for this session)*" : session.transcript.map((turn, i) => {
  const speakerName = turn.speaker === "agent" ? "Student Agent" : "Candidate";
  return `### Turn ${i + 1}: ${speakerName}\n\n> "${turn.text}"`;
}).join("\n\n")}
`;

    const transcriptPath = resolve(transcriptsDir, `${session.id}.md`);
    await writeFile(transcriptPath, mdContent, "utf8");
  }

  const csvPath = resolve(reviewerDir, "sessions.csv");
  await writeFile(csvPath, csvRows.join("\n") + "\n", "utf8");

  console.log(`[reviewer:export] Export complete:`);
  console.log(` - CSV: ${csvPath}`);
  console.log(` - Transcripts written to: ${transcriptsDir} (${completedSessions.length} files)`);
}

// CLI runner
const cliN = process.argv.slice(2).find((arg) => !arg.startsWith("-") && !isNaN(Number(arg)));
const nArg = cliN ? parseInt(cliN, 10) : undefined;
void exportReviewerSessions(nArg);
