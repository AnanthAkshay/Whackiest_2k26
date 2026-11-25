import assert from "node:assert/strict";
import test from "node:test";
import {
  auditEventSchema,
  assessmentAttemptSchema,
  assessmentResultSchema,
  challengeSchema,
  consentRecordSchema,
  credentialSchema,
  datasetSeedSchema,
  evidenceArtifactSchema,
  learnerProfileSchema,
  learningResourceSchema,
  opportunitySchema,
  publicPassportProjectionSchema,
  roleSchema,
  validationReportSchema,
  vivaSessionSchema
} from "./schemas";
import {
  sampleChallenge,
  sampleConsent,
  sampleDatasetSeed,
  sampleLearner,
  sampleLearningResources,
  sampleOpportunities,
  sampleRole
} from "./fixtures";
import type { AssessmentAttempt, AttemptStatus } from "./types";

test("Domain Schemas validate sample fixtures cleanly", () => {
  assert.ok(learnerProfileSchema.safeParse(sampleLearner).success);
  assert.ok(consentRecordSchema.safeParse(sampleConsent).success);
  assert.ok(roleSchema.safeParse(sampleRole).success);
  assert.ok(challengeSchema.safeParse(sampleChallenge).success);
  assert.ok(datasetSeedSchema.safeParse(sampleDatasetSeed).success);

  for (const opp of sampleOpportunities) {
    const parsed = opportunitySchema.safeParse(opp);
    assert.ok(parsed.success, `Sample opportunity ${opp.opportunityId} failed validation`);
    assert.equal(opp.isSample, true, "Opportunities must be explicitly labeled as sample");
  }

  for (const res of sampleLearningResources) {
    const parsed = learningResourceSchema.safeParse(res);
    assert.ok(parsed.success, `Learning resource ${res.resourceId} failed validation`);
  }
});

test("AttemptStatus validates all 9 explicit attempt states", () => {
  const allStates: AttemptStatus[] = [
    "DRAFT",
    "QUEUED",
    "VALIDATING",
    "VIVA_PENDING",
    "VIVA_ACTIVE",
    "SCORING",
    "PENDING_REVIEW",
    "COMPLETED",
    "FAILED"
  ];

  for (const status of allStates) {
    const attempt: AssessmentAttempt = {
      attemptId: `att_${status.toLowerCase()}`,
      userId: "user_test",
      challengeId: "retail_sales_cleanup",
      seedId: "seed_test",
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      status,
      startedAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:00:00.000Z"
    };
    const res = assessmentAttemptSchema.safeParse(attempt);
    assert.ok(res.success, `State ${status} should be valid`);
  }

  // Invalid state
  const invalidAttempt = {
    attemptId: "att_invalid",
    userId: "user_test",
    challengeId: "retail_sales_cleanup",
    seedId: "seed_test",
    skillRubricVersion: "1.0.0",
    challengeRubricVersion: "1.0.0",
    status: "UNKNOWN_STATE",
    startedAt: "2026-11-25T00:00:00.000Z",
    updatedAt: "2026-11-25T00:00:00.000Z"
  };
  assert.equal(assessmentAttemptSchema.safeParse(invalidAttempt).success, false);
});

test("EvidenceArtifact schema enforces 64-char hex SHA-256 and positive size", () => {
  const valid = {
    artifactId: "art_1",
    attemptId: "att_1",
    userId: "user_1",
    storageKey: "artifacts/test.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 24500,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    uploadTime: "2026-11-25T00:00:00.000Z"
  };
  assert.ok(evidenceArtifactSchema.safeParse(valid).success);

  // Short sha256
  assert.equal(evidenceArtifactSchema.safeParse({ ...valid, sha256: "short_hash" }).success, false);
  // Negative size
  assert.equal(evidenceArtifactSchema.safeParse({ ...valid, size: -10 }).success, false);
});

test("ValidationReport schema validates checks and objective score", () => {
  const report = {
    reportId: "rep_1",
    attemptId: "att_1",
    userId: "user_1",
    artifactId: "art_1",
    validatorVersion: "1.0.0",
    practicalScore: 85,
    checks: [
      {
        checkId: "check_trim",
        description: "Whitespace trimmed",
        passed: true,
        score: 25,
        maxScore: 25
      }
    ],
    factIds: ["fact_trim_1"],
    warnings: [],
    createdAt: "2026-11-25T00:00:00.000Z"
  };
  assert.ok(validationReportSchema.safeParse(report).success);
});

test("AssessmentResult schema validates ECVE dimensions, composite, and outcome", () => {
  const result = {
    resultId: "res_1",
    attemptId: "att_1",
    userId: "user_1",
    dimensions: { P: 80, U: 85, C: 90 },
    weights: { P: 0.6, U: 0.25, C: 0.15 },
    composite: 82.75,
    outcome: "Demonstrated",
    criticalCriteriaPassed: true,
    criterionEvidence: [
      {
        criterionId: "spreadsheet_hygiene",
        dimension: "P",
        status: "correct",
        score: 100,
        evidenceQuote: "TRIM formula applied",
        reason: "Cleanly stripped spaces"
      }
    ],
    reviewFlags: [],
    skillRubricVersion: "1.0.0",
    challengeRubricVersion: "1.0.0",
    evaluatedAt: "2026-11-25T00:00:00.000Z"
  };
  assert.ok(assessmentResultSchema.safeParse(result).success);
});

test("Credential schema validates JWS and SHA-256 evidence hash", () => {
  const cred = {
    credentialId: "cred_1",
    resultId: "res_1",
    attemptId: "att_1",
    userId: "user_1",
    jwsPayload: { sub: "user_1", role: "data_entry_operator" },
    jwsSignature: "ed25519_sig_string_test",
    keyId: "key_ed25519_2026_1",
    evidenceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "active",
    issuedAt: "2026-11-25T00:00:00.000Z"
  };
  assert.ok(credentialSchema.safeParse(cred).success);
});

test("PublicPassportProjection strictly enforces database badge wording", () => {
  const passport = {
    passportId: "pass_1",
    publicHandle: "ananya_k",
    displayName: "Ananya Kumar",
    roleTitle: "Entry-Level Data Entry Operator",
    challengeTitle: "Retail Sales Cleanup & Reporting",
    compositeScore: 88,
    dimensions: {
      practicalExecution: 85,
      conceptualUnderstanding: 90,
      evidenceConsistency: 95
    },
    outcome: "Demonstrated",
    evidenceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    issuedAt: "2026-11-25T00:00:00.000Z",
    rubricBasis:
      "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot.",
    verificationBadge: "Record matches our database" as const,
    jwsSignature: "mock_sig_string",
    status: "active" as const
  };
  assert.ok(publicPassportProjectionSchema.safeParse(passport).success);

  // Prohibited alteration to badge wording
  const altered = { ...passport, verificationBadge: "Trainer-verified certified accuracy" };
  assert.equal(publicPassportProjectionSchema.safeParse(altered).success, false);
});
