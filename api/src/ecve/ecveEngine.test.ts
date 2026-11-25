import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { loadChallengeRubric, loadSkillRubric } from "../rubric";
import { LocalFileStore } from "../store/LocalFileStore";
import type { FactSheet } from "../validator/pythonValidator";
import type { VivaTurn } from "../domain/types";
import {
  applyHumanReviewDecision,
  computeDimensionScore,
  computeECVEComposite,
  determineECVEOutcome,
  ECVE_WEIGHTS,
  evaluateECVEAssessment,
  validateEcveWeights,
  type WeightedScaleItem
} from "./ecveEngine";

async function loadSampleFactSheet(): Promise<FactSheet> {
  const raw = await readFile(resolve(process.cwd(), "..", "validator", "sample_fact_sheet.json"), "utf8").catch(
    async () => await readFile(resolve(process.cwd(), "validator", "sample_fact_sheet.json"), "utf8")
  );
  return JSON.parse(raw) as FactSheet;
}

test("ECVE weights sum to 1 and exact composite arithmetic & rounding work", () => {
  assert.doesNotThrow(() => validateEcveWeights(ECVE_WEIGHTS));
  assert.equal(ECVE_WEIGHTS.P + ECVE_WEIGHTS.U + ECVE_WEIGHTS.C, 1);

  // Exact arithmetic: 0.60*80 + 0.25*70 + 0.15*90 = 48 + 17.5 + 13.5 = 79
  const res = computeECVEComposite(80, 70, 90);
  assert.equal(res.composite, 79);
  assert.equal(res.roundedComposite, 79);

  // Dimension 0/1/2 calculation: (0.5*2 + 0.5*1) / (1.0*2) * 100 = 75
  assert.equal(
    computeDimensionScore([
      { weight: 0.5, level: 2 },
      { weight: 0.5, level: 1 }
    ]),
    75
  );
});

test("Outcome boundary conditions: 39.99, 40, 74.99, 75, critical fail, missing evidence, and pending review", () => {
  assert.equal(
    determineECVEOutcome({ composite: 39.99, criticalCriteriaPassed: true, reviewFlags: [] }).outcome,
    "Not yet demonstrated"
  );
  assert.equal(
    determineECVEOutcome({ composite: 40, criticalCriteriaPassed: true, reviewFlags: [] }).outcome,
    "Partially demonstrated"
  );
  assert.equal(
    determineECVEOutcome({ composite: 74.99, criticalCriteriaPassed: true, reviewFlags: [] }).outcome,
    "Partially demonstrated"
  );
  const pass75 = determineECVEOutcome({ composite: 75, criticalCriteriaPassed: true, reviewFlags: [] });
  assert.equal(pass75.outcome, "Demonstrated");
  assert.equal(pass75.credentialEligible, true);

  // >= 75 with failed critical criterion -> Partially demonstrated
  const critFail = determineECVEOutcome({ composite: 88, criticalCriteriaPassed: false, reviewFlags: [] });
  assert.equal(critFail.outcome, "Partially demonstrated");
  assert.equal(critFail.credentialEligible, false);

  // >= 75 with missing minimum evidence -> Partially demonstrated
  const missingEv = determineECVEOutcome({
    composite: 85,
    criticalCriteriaPassed: true,
    reviewFlags: [],
    context: { minimumEvidenceMet: false }
  });
  assert.equal(missingEv.outcome, "Partially demonstrated");
  assert.equal(missingEv.credentialEligible, false);

  // Low transcript confidence -> Pending Human Review (NOT low knowledge score)
  const lowConf = determineECVEOutcome({
    composite: 82,
    criticalCriteriaPassed: true,
    reviewFlags: [],
    context: { lowTranscriptConfidence: true }
  });
  assert.equal(lowConf.outcome, "Pending Human Review");
  assert.equal(lowConf.credentialEligible, false);
});

test("Scripted Fixture Scenarios (scripted tests, not pilot results)", async () => {
  const [factSheet, skillRubric, challengeRubric] = await Promise.all([
    loadSampleFactSheet(),
    loadSkillRubric("excel"),
    loadChallengeRubric("retail_sales_cleanup", { warn: () => {} })
  ]);

  const goodTurns: VivaTurn[] = [
    {
      speaker: "candidate",
      text: "I used =SUM in Summary!B2 to total Sales_Data!E2:E17 and removed duplicate Order IDs so totals aren't inflated.",
      createdAt: "2026-11-25T00:00:00.000Z"
    }
  ];

  const goodUnderstanding: WeightedScaleItem[] = [
    {
      criterionId: "formulas-functions",
      dimension: "U",
      weight: 0.5,
      level: 2,
      evidenceQuote: "I used =SUM in Summary!B2",
      reason: "Explained formula choice clearly"
    },
    {
      criterionId: "tables-sorting-filtering",
      dimension: "U",
      weight: 0.5,
      level: 2,
      evidenceQuote: "removed duplicate Order IDs",
      reason: "Explained duplicate impact"
    }
  ];

  // Scenario 1: Good work + good explanation -> Demonstrated
  const s1 = evaluateECVEAssessment({
    attemptId: "att_s1",
    userId: "u1",
    factSheet,
    challengeRubric,
    skillRubric,
    turns: goodTurns,
    understandingItems: goodUnderstanding
  });
  assert.equal(s1.outcome, "Demonstrated");
  assert.equal(s1.composite, 100);

  // Scenario 2: Good work + weak explanation -> Partially demonstrated (composite: 0.6*100 + 0.25*0 + 0.15*50 = 67.5)
  const weakUnderstanding: WeightedScaleItem[] = goodUnderstanding.map((u) => ({ ...u, level: 0 }));
  const s2 = evaluateECVEAssessment({
    attemptId: "att_s2",
    userId: "u1",
    factSheet,
    challengeRubric,
    skillRubric,
    turns: [{ speaker: "candidate", text: "I clicked some buttons.", createdAt: "2026-11-25T00:00:00.000Z" }],
    understandingItems: weakUnderstanding
  });
  assert.equal(s2.outcome, "Partially demonstrated");

  // Scenario 3: Weak work + good explanation -> Partially demonstrated (critical gate failed)
  const weakFactSheet: FactSheet = {
    ...factSheet,
    checkResults: factSheet.checkResults.map((c) =>
      c.checkId === "chk_summary_formulas" || c.checkId === "chk_duplicates_removed"
        ? { ...c, status: "fail", score: 0 }
        : c
    ),
    formulaFacts: factSheet.formulaFacts.map((f) => ({ ...f, status: "fail" }))
  };
  const s3 = evaluateECVEAssessment({
    attemptId: "att_s3",
    userId: "u1",
    factSheet: weakFactSheet,
    challengeRubric,
    skillRubric,
    turns: [{ speaker: "candidate", text: "Spreadsheets organize data in rows and columns.", createdAt: "2026-11-25T00:00:00.000Z" }],
    understandingItems: goodUnderstanding
  });
  assert.notEqual(s3.outcome, "Demonstrated");
  assert.equal(s3.criticalCriteriaPassed, false);

  // Scenario 4: Mismatched explanation -> Pending Human Review
  const s4 = evaluateECVEAssessment({
    attemptId: "att_s4",
    userId: "u1",
    factSheet: weakFactSheet,
    challengeRubric,
    skillRubric,
    turns: goodTurns, // claims =SUM and duplicates removed while weakFactSheet failed them
    understandingItems: goodUnderstanding
  });
  assert.equal(s4.outcome, "Pending Human Review");
  assert.ok(s4.reviewFlags.some((f) => f.code === "EXPLANATION_ARTIFACT_MISMATCH"));

  // Scenario 5: Ambiguous transcript -> Pending Human Review
  const s5 = evaluateECVEAssessment({
    attemptId: "att_s5",
    userId: "u1",
    factSheet,
    challengeRubric,
    skillRubric,
    turns: goodTurns,
    understandingItems: goodUnderstanding,
    context: { ambiguousEvidence: true }
  });
  assert.equal(s5.outcome, "Pending Human Review");

  // Human review resolution confirms or adjusts while preserving AI result & audit event
  const audited = applyHumanReviewDecision(s5, {
    action: "confirm",
    actor: "mentor_ramesh",
    reason: "Verified transcript meaning matches submitted workbook."
  });
  assert.equal(audited.authoritativeOutcome, "Demonstrated");
  assert.equal(audited.credentialEligible, true);
  assert.equal(audited.aiResult.outcome, "Pending Human Review");
  assert.equal(audited.auditEvent.action, "HUMAN_REVIEW_CONFIRM");
});

test("Idempotent re-scoring returns existing AssessmentResult without duplicates", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-ecve-idem-"));
  try {
    const store = new LocalFileStore(dir);
    const [factSheet, skillRubric, challengeRubric] = await Promise.all([
      loadSampleFactSheet(),
      loadSkillRubric("excel"),
      loadChallengeRubric("retail_sales_cleanup", { warn: () => {} })
    ]);

    const res1 = evaluateECVEAssessment({
      attemptId: "att_idem",
      userId: "u1",
      factSheet,
      challengeRubric,
      skillRubric,
      turns: [{ speaker: "candidate", text: "Used =SUM", createdAt: "2026-11-25T00:00:00.000Z" }],
      understandingItems: [
        {
          criterionId: "formulas-functions",
          dimension: "U",
          weight: 1,
          level: 2,
          evidenceQuote: "Used =SUM",
          reason: "Clear"
        }
      ],
      idempotencyKey: "score_att_idem_v1"
    });
    const saved1 = await store.saveAssessmentResult(res1);

    const res2 = evaluateECVEAssessment({
      attemptId: "att_idem",
      userId: "u1",
      factSheet,
      challengeRubric,
      skillRubric,
      turns: [{ speaker: "candidate", text: "Used =SUM", createdAt: "2026-11-25T00:00:00.000Z" }],
      understandingItems: [
        {
          criterionId: "formulas-functions",
          dimension: "U",
          weight: 1,
          level: 2,
          evidenceQuote: "Used =SUM",
          reason: "Clear"
        }
      ],
      idempotencyKey: "score_att_idem_v1"
    });
    const saved2 = await store.saveAssessmentResult(res2);

    assert.equal(saved2.resultId, saved1.resultId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
