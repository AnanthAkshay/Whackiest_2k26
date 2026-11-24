import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSkillRubric } from "../../api/src/rubric";

interface EvaluatedRow {
  sessionId: string;
  language: string;
  rubricVersion: string;
  aiTotal: number;
  reviewerTotal: number;
  totalDiff: number;
  totalWithin10: boolean;
  criteriaScores: Record<string, { ai: number; reviewer: number; diff: number; within10: boolean }>;
}

export async function compareReviewerData(): Promise<void> {
  const reviewerDir = resolve(process.cwd(), "tests", "reviewer");
  const csvPath = resolve(reviewerDir, "sessions.csv");
  const reportPath = resolve(reviewerDir, "report.md");

  let rawCsv: string;
  try {
    rawCsv = await readFile(csvPath, "utf8");
  } catch (error) {
    console.error(`[reviewer:compare] Could not read ${csvPath}. Please run 'npm run reviewer:export' first.`);
    return;
  }

  const lines = rawCsv.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) {
    console.warn("[reviewer:compare] sessions.csv is empty or contains only headers.");
    return;
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const sessionIdIdx = headers.indexOf("sessionId");
  const languageIdx = headers.indexOf("language");
  const rubricVersionIdx = headers.indexOf("rubricVersion");
  const aiTotalIdx = headers.indexOf("aiTotal");
  const reviewerTotalIdx = headers.indexOf("reviewerTotal");

  if (sessionIdIdx === -1 || aiTotalIdx === -1 || reviewerTotalIdx === -1) {
    console.error("[reviewer:compare] sessions.csv is missing required header columns.");
    return;
  }

  const rubric = await loadSkillRubric("excel");

  const evaluatedRows: EvaluatedRow[] = [];
  const blankRows: string[] = [];
  const incompleteRows: { id: string; reason: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const sessionId = cols[sessionIdIdx] || `row-${i}`;
    const language = cols[languageIdx] || "en";
    const rubricVersion = cols[rubricVersionIdx] || rubric.version;
    const aiTotalRaw = cols[aiTotalIdx];
    const reviewerTotalRaw = cols[reviewerTotalIdx];

    const aiTotal = parseFloat(aiTotalRaw);
    if (isNaN(aiTotal)) {
      incompleteRows.push({ id: sessionId, reason: `Invalid aiTotal '${aiTotalRaw}'` });
      continue;
    }

    // Inspect reviewer criteria columns
    const criteriaScores: Record<string, { ai: number; reviewer: number; diff: number; within10: boolean }> = {};
    let anyReviewerCriterionFilled = false;
    let allReviewerCriteriaFilled = true;
    let weightedReviewerSum = 0;

    for (const criterion of rubric.criteria) {
      const aiColName = `aiScore_${criterion.id}`;
      const revColName = `reviewerScore_${criterion.id}`;
      const aiIdx = headers.indexOf(aiColName);
      const revIdx = headers.indexOf(revColName);

      const aiScore = aiIdx !== -1 && !isNaN(parseFloat(cols[aiIdx])) ? parseFloat(cols[aiIdx]) : 0;
      const revScoreRaw = revIdx !== -1 ? cols[revIdx] : "";

      if (revScoreRaw !== "" && !isNaN(parseFloat(revScoreRaw))) {
        anyReviewerCriterionFilled = true;
        const revScore = parseFloat(revScoreRaw);
        weightedReviewerSum += revScore * criterion.weight;
        const diff = Math.abs(aiScore - revScore);
        criteriaScores[criterion.id] = {
          ai: aiScore,
          reviewer: revScore,
          diff,
          within10: diff <= 10
        };
      } else {
        allReviewerCriteriaFilled = false;
      }
    }

    // Check if entire reviewer response is blank
    const reviewerTotalIsBlank = reviewerTotalRaw === "" || isNaN(parseFloat(reviewerTotalRaw));
    if (reviewerTotalIsBlank && !anyReviewerCriterionFilled) {
      blankRows.push(sessionId);
      console.log(`[INFO] Row ${i} (Session: ${sessionId}): Reviewer columns are blank. Skipped from comparison.`);
      continue;
    }

    // Determine final reviewer total
    let finalReviewerTotal: number;
    if (!reviewerTotalIsBlank) {
      finalReviewerTotal = parseFloat(reviewerTotalRaw);
    } else if (allReviewerCriteriaFilled) {
      finalReviewerTotal = Math.round(weightedReviewerSum);
      console.log(`[INFO] Row ${i} (Session: ${sessionId}): reviewerTotal was blank; computed weighted total of ${finalReviewerTotal}.`);
    } else {
      incompleteRows.push({ id: sessionId, reason: "reviewerTotal is blank and some criterion scores are missing" });
      console.warn(`[WARN] Row ${i} (Session: ${sessionId}): Incomplete reviewer scores. Skipped.`);
      continue;
    }

    const totalDiff = Math.abs(aiTotal - finalReviewerTotal);
    evaluatedRows.push({
      sessionId,
      language,
      rubricVersion,
      aiTotal,
      reviewerTotal: finalReviewerTotal,
      totalDiff,
      totalWithin10: totalDiff <= 10,
      criteriaScores
    });
  }

  const n = evaluatedRows.length;
  console.log(`\n=================================================`);
  console.log(`      Prooffolio - Early Reviewer Check Report   `);
  console.log(`=================================================`);
  console.log(`Total sessions in CSV : ${lines.length - 1}`);
  console.log(`Evaluated sessions (N): ${n}`);
  console.log(`Blank sessions        : ${blankRows.length}`);
  console.log(`Incomplete sessions   : ${incompleteRows.length}`);

  if (n === 0) {
    console.warn(`\n[reviewer:compare] No evaluated sessions found with completed reviewer scores.`);
    console.warn(`Please review transcripts in tests/reviewer/transcripts/ and fill reviewer scores in tests/reviewer/sessions.csv.`);
    return;
  }

  // Aggregate Metrics
  const meanTotalDiff = evaluatedRows.reduce((acc, r) => acc + r.totalDiff, 0) / n;
  const within10Count = evaluatedRows.filter((r) => r.totalWithin10).length;
  const agreementWithin10Share = (within10Count / n) * 100;

  console.log(`\n--- SUMMARY METRICS ---`);
  console.log(`Mean Absolute Difference in Total: ${meanTotalDiff.toFixed(2)} points`);
  console.log(`Agreement within 10 points       : ${within10Count} / ${n} (${agreementWithin10Share.toFixed(1)}%)`);

  console.log(`\n--- PER-CRITERION AGREEMENT ---`);
  const criterionStats: {
    id: string;
    name: string;
    evaluatedCount: number;
    meanDiff: number;
    within10Count: number;
    within10Share: number;
  }[] = [];

  for (const criterion of rubric.criteria) {
    const scoredRows = evaluatedRows.filter((r) => r.criteriaScores[criterion.id] !== undefined);
    const count = scoredRows.length;
    if (count > 0) {
      const meanDiff = scoredRows.reduce((acc, r) => acc + r.criteriaScores[criterion.id].diff, 0) / count;
      const within10 = scoredRows.filter((r) => r.criteriaScores[criterion.id].within10).length;
      criterionStats.push({
        id: criterion.id,
        name: criterion.name,
        evaluatedCount: count,
        meanDiff,
        within10Count: within10,
        within10Share: (within10 / count) * 100
      });
      console.log(` - ${criterion.name} (${criterion.id}): Mean Diff = ${meanDiff.toFixed(2)} pts | Within 10 pts = ${within10}/${count} (${((within10 / count) * 100).toFixed(1)}%)`);
    } else {
      criterionStats.push({
        id: criterion.id,
        name: criterion.name,
        evaluatedCount: 0,
        meanDiff: 0,
        within10Count: 0,
        within10Share: 0
      });
      console.log(` - ${criterion.name} (${criterion.id}): No reviewer criterion scores provided.`);
    }
  }

  // Build report.md
  // HONESTY RULE:
  // First line MUST be exactly:
  // Early check with one reviewer on N sessions. This is not validation and not the pilot agreement test.
  // Include date and rubric version.
  // Never use the words validated, verified or accuracy anywhere in the report.
  const today = new Date().toISOString().slice(0, 10);
  const rubricVersion = evaluatedRows[0]?.rubricVersion ?? rubric.version;

  const reportLines = [
    `Early check with one reviewer on ${n} sessions. This is not validation and not the pilot agreement test.`,
    "",
    `## Session Review Overview`,
    "",
    `- **Date**: ${today}`,
    `- **Rubric Version**: ${rubricVersion}`,
    `- **Evaluated Sessions (N)**: **${n}**`,
    `- **Blank or Unscored Sessions**: ${blankRows.length}`,
    `- **Incomplete Sessions**: ${incompleteRows.length}`,
    "",
    `## Summary Metrics`,
    "",
    `- **Mean Absolute Difference in Total**: **${meanTotalDiff.toFixed(2)} points**`,
    `- **Agreement within 10 points**: **${within10Count} / ${n} (${agreementWithin10Share.toFixed(1)}%)**`,
    "",
    `| Metric | Result | Description |`,
    `|---|---|---|`,
    `| **Evaluated Sessions** | **${n}** | Completed transcripts independently scored by human reviewer |`,
    `| **Mean Absolute Difference** | **${meanTotalDiff.toFixed(2)} pts** | Average absolute spread between AI total and human reviewer total |`,
    `| **Agreement within 10 points** | **${agreementWithin10Share.toFixed(1)}%** (${within10Count}/${n}) | Share of sessions where AI and human reviewer totals differ by $\\le 10$ points |`,
    "",
    `## Per-Criterion Agreement Breakdown`,
    "",
    `| Criterion | Rubric ID | Scored Sessions | Mean Absolute Difference | Agreement Within 10 Points |`,
    `|---|---|---|---|---|`,
    ...criterionStats.map((cs) => {
      if (cs.evaluatedCount === 0) {
        return `| ${cs.name} | \`${cs.id}\` | 0 | N/A | N/A |`;
      }
      return `| ${cs.name} | \`${cs.id}\` | ${cs.evaluatedCount} | **${cs.meanDiff.toFixed(2)} pts** | **${cs.within10Count} / ${cs.evaluatedCount} (${cs.within10Share.toFixed(1)}%)** |`;
    }),
    "",
    `## Session-by-Session Comparison`,
    "",
    `| Session ID | Language | AI Total | Reviewer Total | Difference | Agreement ($\le 10$ pts) |`,
    `|---|---|---|---|---|---|`,
    ...evaluatedRows.map((r) => `| \`${r.sessionId}\` | ${r.language} | **${r.aiTotal}** | **${r.reviewerTotal}** | ${r.totalDiff.toFixed(1)} pts | ${r.totalWithin10 ? "Yes" : "No"} |`),
    "",
    ...(blankRows.length > 0 ? [
      `### Unscored / Blank Sessions (${blankRows.length})`,
      `The following sessions were exported to \`sessions.csv\` but contained no reviewer input:`,
      ...blankRows.map((id) => `- \`${id}\``),
      ""
    ] : []),
    `---`,
    `*Report produced automatically by reviewer check tooling on ${today}.*`
  ];

  const reportText = reportLines.join("\n") + "\n";

  // Strict Honesty Check on generated report content:
  // Must NOT contain: "validated", "verified", or "accuracy" (case-insensitive)
  const bannedCheck = reportText.match(/\b(validated|verified|accuracy)\b/i);
  if (bannedCheck) {
    throw new Error(`CRITICAL HONESTY VIOLATION: Report contains prohibited word '${bannedCheck[0]}'.`);
  }

  await writeFile(reportPath, reportText, "utf8");
  console.log(`\nReport written to: ${reportPath}`);
}

void compareReviewerData();
