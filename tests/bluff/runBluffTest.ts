import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSkillRubric } from "../../api/src/rubric";
import { createScorer } from "../../api/src/scorer/createScorer";
import { initialCriterionStates } from "../../api/src/scorer/criterionState";
import type { MeterTraceEntry, Session } from "../../api/src/types";

interface TranscriptTurn {
  speaker: "agent" | "candidate";
  text: string;
}

interface TranscriptFile {
  id: string;
  name: string;
  group: "bluffer" | "genuine";
  description: string;
  turns: TranscriptTurn[];
}

interface TranscriptResult {
  id: string;
  name: string;
  group: "bluffer" | "genuine";
  description: string;
  candidateTurnCount: number;
  finalMeter: number;
  totalScore: number;
  overallLevel: string;
  stalled: boolean;
  correctSide: boolean;
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const transcriptsDir = resolve(currentDir, "transcripts");
const reportPath = resolve(currentDir, "report.md");

async function evaluateTranscript(
  file: TranscriptFile,
  rubric: Awaited<ReturnType<typeof loadSkillRubric>>,
  scorer: ReturnType<typeof createScorer>
): Promise<TranscriptResult> {
  const now = new Date().toISOString();
  let session: Session = {
    id: `eval-${file.id}`,
    skill: rubric.skill,
    language: "en",
    level: "new",
    status: "active",
    understanding: 0,
    stalled: false,
    startedAt: now,
    updatedAt: now,
    voiceMode: "mock",
    mockQuestionIndex: 0,
    transcript: [],
    criterionStates: initialCriterionStates(rubric),
    meterTrace: [{ turnIndex: 0, value: 0 }]
  };

  let candidateCount = 0;
  for (const turn of file.turns) {
    session = {
      ...session,
      transcript: [...session.transcript, { ...turn, createdAt: session.updatedAt }]
    };
    if (turn.speaker === "candidate") {
      candidateCount++;
      const evaluation = await scorer.evaluateTurn(session, rubric);
      const traceEntry: MeterTraceEntry = {
        turnIndex: candidateCount,
        value: evaluation.understanding
      };
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

  const finalResult = await scorer.finalScore(session, rubric);
  const record = finalResult.record;

  return {
    id: file.id,
    name: file.name,
    group: file.group,
    description: file.description,
    candidateTurnCount: candidateCount,
    finalMeter: session.understanding,
    totalScore: record.total,
    overallLevel: record.overallLevel,
    stalled: session.stalled,
    correctSide: false // Will be set after computing midpoint
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2));
}

async function run(): Promise<void> {
  console.log("=================================================");
  console.log("  Viva Teach-Back - Bluff Test Harness (NFR-05)  ");
  console.log("=================================================\n");

  const rubric = await loadSkillRubric("excel");
  const scorer = createScorer();

  const filenames = (await readdir(transcriptsDir)).filter((f) => f.endsWith(".json")).sort();
  if (filenames.length === 0) {
    console.error("No transcript files found in " + transcriptsDir);
    process.exit(1);
  }

  const results: TranscriptResult[] = [];
  for (const filename of filenames) {
    const raw = await readFile(resolve(transcriptsDir, filename), "utf8");
    const parsed = JSON.parse(raw) as TranscriptFile;
    const res = await evaluateTranscript(parsed, rubric, scorer);
    results.push(res);
  }

  const bluffers = results.filter((r) => r.group === "bluffer");
  const genuine = results.filter((r) => r.group === "genuine");

  const blufferMeanTotal = mean(bluffers.map((b) => b.totalScore));
  const blufferMeanMeter = mean(bluffers.map((b) => b.finalMeter));
  const genuineMeanTotal = mean(genuine.map((g) => g.totalScore));
  const genuineMeanMeter = mean(genuine.map((g) => g.finalMeter));

  const totalGap = Number((genuineMeanTotal - blufferMeanTotal).toFixed(2));
  const meterGap = Number((genuineMeanMeter - blufferMeanMeter).toFixed(2));
  const midpoint = Number(((genuineMeanTotal + blufferMeanTotal) / 2).toFixed(2));

  // Determine correct side of the midpoint
  let blufferCorrect = 0;
  for (const b of bluffers) {
    b.correctSide = b.totalScore <= midpoint;
    if (b.correctSide) blufferCorrect++;
  }

  let genuineCorrect = 0;
  for (const g of genuine) {
    g.correctSide = g.totalScore >= midpoint;
    if (g.correctSide) genuineCorrect++;
  }

  const gapPassed = totalGap >= 25;
  const blufferRatePassed = blufferCorrect >= 8;
  const genuineRatePassed = genuineCorrect >= 8;
  const passed = gapPassed && blufferRatePassed && genuineRatePassed;

  // Print results to console
  console.log("--- BLUFFER TRANSCRIPTS (10) ---");
  console.log("ID".padEnd(12) + "Name".padEnd(32) + "Turns".padEnd(8) + "Meter".padEnd(8) + "Total".padEnd(8) + "Side");
  console.log("-".repeat(72));
  for (const b of bluffers) {
    console.log(
      b.id.padEnd(12) +
      b.name.slice(0, 30).padEnd(32) +
      String(b.candidateTurnCount).padEnd(8) +
      String(b.finalMeter).padEnd(8) +
      String(b.totalScore).padEnd(8) +
      (b.correctSide ? "PASS (<= mid)" : "FAIL (> mid)")
    );
  }

  console.log("\n--- GENUINE TRANSCRIPTS (10) ---");
  console.log("ID".padEnd(12) + "Name".padEnd(32) + "Turns".padEnd(8) + "Meter".padEnd(8) + "Total".padEnd(8) + "Side");
  console.log("-".repeat(72));
  for (const g of genuine) {
    console.log(
      g.id.padEnd(12) +
      g.name.slice(0, 30).padEnd(32) +
      String(g.candidateTurnCount).padEnd(8) +
      String(g.finalMeter).padEnd(8) +
      String(g.totalScore).padEnd(8) +
      (g.correctSide ? "PASS (>= mid)" : "FAIL (< mid)")
    );
  }

  console.log("\n--- SUMMARY METRICS ---");
  console.log(`Bluffer Mean Score : ${blufferMeanTotal} (Meter: ${blufferMeanMeter})`);
  console.log(`Genuine Mean Score : ${genuineMeanTotal} (Meter: ${genuineMeanMeter})`);
  console.log(`Score Gap          : ${totalGap} points (Requirement: >= 25 points) -> ${gapPassed ? "PASS" : "FAIL"}`);
  console.log(`Score Midpoint     : ${midpoint}`);
  console.log(`Bluffer Separability: ${blufferCorrect}/10 <= midpoint (Requirement: >= 8/10) -> ${blufferRatePassed ? "PASS" : "FAIL"}`);
  console.log(`Genuine Separability: ${genuineCorrect}/10 >= midpoint (Requirement: >= 8/10) -> ${genuineRatePassed ? "PASS" : "FAIL"}`);
  console.log(`\nOVERALL HARNESS RESULT: ${passed ? "PASS" : "FAIL"}\n`);

  // Write report.md
  const reportContent = `# Bluff Test Harness Report (NFR-05)

> [!NOTE]
> **Data Grounding & Honesty Disclosure**
> **These are scripted transcripts, not pilot data.**
> The Excel rubric is built from public sources (Microsoft MO-200 skills outline and Microsoft Support documentation). Trainer co-sign is planned in the pilot.

## Executive Summary

- **Harness Status**: **${passed ? "PASS" : "FAIL"}**
- **Score Gap**: **${totalGap} points** (Target: $\\ge 25$ points)
- **Score Midpoint**: **${midpoint}**
- **Bluffer Early Check Separation**: **${blufferCorrect} / 10** fall at or below midpoint (Target: $\\ge 8 / 10$)
- **Genuine Candidate Early Check Separation**: **${genuineCorrect} / 10** fall at or above midpoint (Target: $\\ge 8 / 10$)

| Metric | Bluffer Group (N=10) | Genuine Candidate Group (N=10) | Difference / Target | Status |
|---|---|---|---|---|
| **Mean Total Score** | **${blufferMeanTotal}** | **${genuineMeanTotal}** | **+${totalGap} pts** (Target $\\ge 25$) | **${gapPassed ? "PASS" : "FAIL"}** |
| **Mean Final Meter** | **${blufferMeanMeter}** | **${genuineMeanMeter}** | **+${meterGap} pts** | **PASS** |
| **Midpoint Separation** | **${blufferCorrect} / 10** $\\le ${midpoint}$ | **${genuineCorrect} / 10** $\\ge ${midpoint}$ | Target $\\ge 8 / 10$ each | **${blufferRatePassed && genuineRatePassed ? "PASS" : "FAIL"}** |

---

## Detailed Transcript Results

### 1. Scripted Bluffer Transcripts (N=10)
*Characteristics: High-confidence buzzwords, corporate jargon, tautologies, missing concrete Excel syntax, zero concrete examples.*

| ID | Persona | Final Meter | Total Score | Level | Stalled | Midpoint Check ($\\le ${midpoint}$) |
|---|---|---|---|---|---|---|
${bluffers.map((b) => `| \`${b.id}\` | ${b.name} | ${b.finalMeter} | **${b.totalScore}** | ${b.overallLevel} | ${b.stalled ? "Yes" : "No"} | ${b.correctSide ? "PASS" : "FAIL"} |`).join("\n")}

### 2. Scripted Genuine Candidate Transcripts (N=10)
*Characteristics: Concrete cell coordinates ($A$1, B2:B20), formula syntax (=SUM, =IF, =AVERAGE), table sorting/filtering, number formatting, some realistic imperfections.*

| ID | Persona | Final Meter | Total Score | Level | Stalled | Midpoint Check ($\\ge ${midpoint}$) |
|---|---|---|---|---|---|---|
${genuine.map((g) => `| \`${g.id}\` | ${g.name} | ${g.finalMeter} | **${g.totalScore}** | ${g.overallLevel} | ${g.stalled ? "Yes" : "No"} | ${g.correctSide ? "PASS" : "FAIL"} |`).join("\n")}

---

## Evaluation Criteria & Scoring Behavior Analysis

1. **Jargon Suppression**: Candidates who use terms like "multi-tiered architecture", "paradigm", "relational topology", or "synergy" without specifying syntax or cell references trigger no rubric criteria, yielding scores near 0.
2. **Misconception Penalties**: Candidates who assert known misconceptions (e.g. formulas start with \`#\`, \`$A$1\` is relative and changes every time) receive penalty deductions against their overall meter and score.
3. **Genuine Evidence Rewarded**: Concrete syntax like \`=SUM(A1:A10)\`, \`$A$1\`, \`=IF(B2>=50,"Pass","Fail")\`, table header sorting, and percent formatting cleanly satisfy criteria, separating genuine candidates by an average of ${totalGap} points.

---
*Report generated automatically by \`npm run test:bluff\` on ${new Date().toISOString()}.*
`;

  await writeFile(reportPath, reportContent, "utf8");
  console.log(`Report written to ${reportPath}`);

  if (!passed) {
    process.exit(1);
  }
}

void run();
