import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFileStore } from "./LocalFileStore";
import { UnauthorizedAccessError } from "./Store";
import {
  sampleChallenge,
  sampleConsent,
  sampleLearner,
  sampleLearningResources,
  sampleOpportunities,
  sampleRole
} from "../domain/fixtures";
import type {
  AssessmentAttempt,
  AssessmentResult,
  AuditEvent,
  Credential,
  EvidenceArtifact,
  ValidationReport,
  VivaSession
} from "../domain/types";

test("LocalFileStore Contract: complete domain entity round-trips", async () => {
  const directory = await mkdtemp(join(tmpdir(), "prooffolio-store-contract-"));
  try {
    const store = new LocalFileStore(directory);

    // 1. Learner Profile & Consent
    await store.saveLearnerProfile(sampleLearner);
    const retrievedLearner = await store.getLearnerProfile(sampleLearner.userId);
    assert.deepEqual(retrievedLearner, sampleLearner);

    await store.saveConsent(sampleConsent);
    const retrievedConsent = await store.getConsent(sampleConsent.userId);
    assert.deepEqual(retrievedConsent, sampleConsent);

    // 2. Roles & Challenges
    await store.saveRole(sampleRole);
    assert.deepEqual(await store.getRole(sampleRole.roleId), sampleRole);
    assert.equal((await store.listRoles()).length, 1);

    await store.saveChallenge(sampleChallenge);
    assert.deepEqual(await store.getChallenge(sampleChallenge.challengeId), sampleChallenge);
    assert.equal((await store.listChallenges("data_entry_operator")).length, 1);

    // 3. Assessment Attempt
    const attempt: AssessmentAttempt = {
      attemptId: "att_contract_01",
      userId: sampleLearner.userId,
      challengeId: sampleChallenge.challengeId,
      seedId: "seed_retail_2026_01",
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      status: "DRAFT",
      startedAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:00:00.000Z",
      idempotencyKey: "idem_att_01"
    };
    await store.createAttempt(attempt);
    assert.deepEqual(await store.getAttempt(attempt.attemptId, sampleLearner.userId), attempt);

    // Advance state to COMPLETED
    const completedAttempt = { ...attempt, status: "COMPLETED" as const, completedAt: "2026-11-25T00:15:00.000Z" };
    await store.saveAttempt(completedAttempt);
    assert.equal((await store.getAttempt(attempt.attemptId))?.status, "COMPLETED");

    // 4. Evidence Artifact & Validation Report
    const artifact: EvidenceArtifact = {
      artifactId: "art_contract_01",
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      storageKey: "submissions/retail_cleaned.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 48120,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      uploadTime: "2026-11-25T00:05:00.000Z",
      idempotencyKey: "idem_art_01"
    };
    await store.saveEvidenceArtifact(artifact);
    assert.deepEqual(await store.getEvidenceArtifact(artifact.artifactId, sampleLearner.userId), artifact);

    const report: ValidationReport = {
      reportId: "rep_contract_01",
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      artifactId: artifact.artifactId,
      validatorVersion: "1.0.0",
      practicalScore: 92,
      checks: [
        { checkId: "check_trim", description: "Whitespace trimmed", passed: true, score: 25, maxScore: 25 },
        { checkId: "check_dates", description: "Dates normalized", passed: true, score: 25, maxScore: 25 },
        { checkId: "check_summary", description: "SUM/AVG formulas", passed: true, score: 42, maxScore: 50 }
      ],
      factIds: ["fact_trim_01", "fact_dates_01", "fact_sum_01"],
      warnings: [],
      createdAt: "2026-11-25T00:06:00.000Z",
      idempotencyKey: "idem_rep_01"
    };
    await store.saveValidationReport(report);
    assert.deepEqual(await store.getValidationReport(report.reportId, sampleLearner.userId), report);

    // 5. Viva Session
    const viva: VivaSession = {
      sessionId: "viva_contract_01",
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      language: "kn",
      status: "complete",
      providerConfig: { provider: "mock", voiceMode: "mock" },
      transcriptReference: {
        turnCount: 2,
        turns: [
          { speaker: "agent", text: "Why did you use =SUM in cell F45?", createdAt: "2026-11-25T00:07:00.000Z" },
          { speaker: "candidate", text: "Because F2:F44 contains daily sales amounts.", createdAt: "2026-11-25T00:07:25.000Z" }
        ]
      },
      durationSeconds: 180,
      startedAt: "2026-11-25T00:07:00.000Z",
      endedAt: "2026-11-25T00:10:00.000Z"
    };
    await store.saveVivaSession(viva);
    assert.deepEqual(await store.getVivaSession(viva.sessionId, sampleLearner.userId), viva);

    // 6. Assessment Result & Credential V2
    const result: AssessmentResult = {
      resultId: "res_contract_01",
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      dimensions: { P: 92, U: 88, C: 95 },
      weights: { P: 0.6, U: 0.25, C: 0.15 },
      composite: 91.45,
      outcome: "Demonstrated",
      criticalCriteriaPassed: true,
      criterionEvidence: [
        {
          criterionId: "summary_aggregation",
          dimension: "P",
          status: "correct",
          score: 100,
          evidenceQuote: "=SUM(F2:F44)",
          reason: "Correct range and formula"
        }
      ],
      reviewFlags: [],
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      evaluatedAt: "2026-11-25T00:12:00.000Z",
      idempotencyKey: "idem_res_01"
    };
    await store.saveAssessmentResult(result);
    assert.deepEqual(await store.getAssessmentResult(result.resultId, sampleLearner.userId), result);

    const credential: Credential = {
      credentialId: "pass_contract_01",
      resultId: result.resultId,
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      jwsPayload: { sub: sampleLearner.userId, composite: 91.45 },
      jwsSignature: "ed25519_test_signature_contract",
      keyId: "ed25519_key_2026",
      evidenceHash: artifact.sha256,
      status: "active",
      issuedAt: "2026-11-25T00:13:00.000Z",
      idempotencyKey: "idem_cred_01"
    };
    await store.saveCredentialV2(credential);
    assert.deepEqual(await store.getCredentialV2(credential.credentialId, sampleLearner.userId), credential);

    // 7. Opportunity & Learning Resources
    for (const opp of sampleOpportunities) {
      await store.saveOpportunity(opp);
    }
    const opportunities = await store.listOpportunities({ activeOnly: true });
    assert.equal(opportunities.length, 3);

    for (const res of sampleLearningResources) {
      await store.saveLearningResource(res);
    }
    const resources = await store.listLearningResources("data_entry_operator");
    assert.equal(resources.length, 3);

    // 8. Audit Event
    const event: AuditEvent = {
      eventId: "evt_01",
      entityType: "credential",
      entityId: credential.credentialId,
      userId: sampleLearner.userId,
      action: "ISSUE_CREDENTIAL",
      details: { outcome: "Demonstrated", composite: 91.45 },
      timestamp: "2026-11-25T00:14:00.000Z"
    };
    await store.recordAuditEvent(event);
    const auditLogs = await store.listAuditEvents(credential.credentialId);
    assert.equal(auditLogs.length, 1);
    assert.deepEqual(auditLogs[0], event);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("LocalFileStore Idempotency: prevents duplicate creation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "prooffolio-store-idempotency-"));
  try {
    const store = new LocalFileStore(directory);

    const attempt1: AssessmentAttempt = {
      attemptId: "att_orig_01",
      userId: "user_alice",
      challengeId: "retail_sales_cleanup",
      seedId: "seed_01",
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      status: "DRAFT",
      startedAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:00:00.000Z",
      idempotencyKey: "idem_key_same"
    };
    const created1 = await store.createAttempt(attempt1);

    // Duplicate createAttempt with identical idempotencyKey
    const attempt2: AssessmentAttempt = {
      ...attempt1,
      attemptId: "att_dup_02" // different attemptId
    };
    const created2 = await store.createAttempt(attempt2);

    // Should return existing attempt1
    assert.equal(created2.attemptId, created1.attemptId);

    // Artifact idempotency
    const artifact1: EvidenceArtifact = {
      artifactId: "art_01",
      attemptId: created1.attemptId,
      userId: "user_alice",
      storageKey: "sub/1.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 1000,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      uploadTime: "2026-11-25T00:00:00.000Z",
      idempotencyKey: "idem_upload_01"
    };
    await store.saveEvidenceArtifact(artifact1);
    const artifactDup = { ...artifact1, artifactId: "art_dup_02" };
    const savedArtifact = await store.saveEvidenceArtifact(artifactDup);
    assert.equal(savedArtifact.artifactId, "art_01");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("LocalFileStore Privacy: a learner cannot read another learner's private records", async () => {
  const directory = await mkdtemp(join(tmpdir(), "prooffolio-store-privacy-"));
  try {
    const store = new LocalFileStore(directory);

    const aliceAttempt: AssessmentAttempt = {
      attemptId: "att_alice_01",
      userId: "user_alice",
      challengeId: "retail_sales_cleanup",
      seedId: "seed_01",
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      status: "DRAFT",
      startedAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:00:00.000Z"
    };
    await store.createAttempt(aliceAttempt);

    const aliceArtifact: EvidenceArtifact = {
      artifactId: "art_alice_01",
      attemptId: aliceAttempt.attemptId,
      userId: "user_alice",
      storageKey: "private/alice_submission.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 15000,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      uploadTime: "2026-11-25T00:01:00.000Z"
    };
    await store.saveEvidenceArtifact(aliceArtifact);

    const aliceReport: ValidationReport = {
      reportId: "rep_alice_01",
      attemptId: aliceAttempt.attemptId,
      userId: "user_alice",
      artifactId: aliceArtifact.artifactId,
      validatorVersion: "1.0.0",
      practicalScore: 90,
      checks: [],
      factIds: [],
      warnings: [],
      createdAt: "2026-11-25T00:02:00.000Z"
    };
    await store.saveValidationReport(aliceReport);

    const aliceViva: VivaSession = {
      sessionId: "viva_alice_01",
      attemptId: aliceAttempt.attemptId,
      userId: "user_alice",
      language: "en",
      status: "complete",
      providerConfig: { provider: "mock", voiceMode: "mock" },
      transcriptReference: {
        turnCount: 1,
        turns: [{ speaker: "candidate", text: "Alice confidential reasoning", createdAt: "2026-11-25T00:03:00.000Z" }]
      },
      durationSeconds: 120,
      startedAt: "2026-11-25T00:03:00.000Z"
    };
    await store.saveVivaSession(aliceViva);

    // Alice can access her own records
    assert.ok(await store.getAttempt(aliceAttempt.attemptId, "user_alice"));
    assert.ok(await store.getEvidenceArtifact(aliceArtifact.artifactId, "user_alice"));
    assert.ok(await store.getValidationReport(aliceReport.reportId, "user_alice"));
    assert.ok(await store.getVivaSession(aliceViva.sessionId, "user_alice"));

    // Bob attempting to access Alice's records MUST throw UnauthorizedAccessError
    await assert.rejects(
      async () => await store.getAttempt(aliceAttempt.attemptId, "user_bob"),
      UnauthorizedAccessError
    );
    await assert.rejects(
      async () => await store.getEvidenceArtifact(aliceArtifact.artifactId, "user_bob"),
      UnauthorizedAccessError
    );
    await assert.rejects(
      async () => await store.getValidationReport(aliceReport.reportId, "user_bob"),
      UnauthorizedAccessError
    );
    await assert.rejects(
      async () => await store.getVivaSession(aliceViva.sessionId, "user_bob"),
      UnauthorizedAccessError
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("LocalFileStore Public Passport: projects only safe public fields and excludes private evidence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "prooffolio-store-passport-"));
  try {
    const store = new LocalFileStore(directory);

    await store.saveLearnerProfile(sampleLearner);
    await store.saveConsent(sampleConsent);
    await store.saveRole(sampleRole);
    await store.saveChallenge(sampleChallenge);

    const attempt: AssessmentAttempt = {
      attemptId: "att_proj_01",
      userId: sampleLearner.userId,
      challengeId: sampleChallenge.challengeId,
      seedId: "seed_01",
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      status: "COMPLETED",
      startedAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:10:00.000Z"
    };
    await store.createAttempt(attempt);

    const result: AssessmentResult = {
      resultId: "res_proj_01",
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      dimensions: { P: 95, U: 85, C: 90 },
      weights: { P: 0.6, U: 0.25, C: 0.15 },
      composite: 91.75,
      outcome: "Demonstrated",
      criticalCriteriaPassed: true,
      criterionEvidence: [],
      reviewFlags: [],
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      evaluatedAt: "2026-11-25T00:11:00.000Z"
    };
    await store.saveAssessmentResult(result);

    const cred: Credential = {
      credentialId: "pass_proj_01",
      resultId: result.resultId,
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      jwsPayload: { secretSalt: "sensitive_internal_data" },
      jwsSignature: "signed_ed25519_jwt_proof",
      keyId: "ed25519_key_1",
      evidenceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: "active",
      issuedAt: "2026-11-25T00:12:00.000Z"
    };
    await store.saveCredentialV2(cred);

    // Query public passport (anyone can query without userId)
    const passport = await store.getPublicPassport(cred.credentialId);
    assert.ok(passport);
    assert.equal(passport.passportId, "pass_proj_01");
    assert.equal(passport.publicHandle, "ananya_k");
    assert.equal(passport.displayName, "Ananya Kumar"); // consented sharing
    assert.equal(passport.roleTitle, "Entry-Level Data Entry Operator");
    assert.equal(passport.challengeTitle, "Retail Sales Cleanup & Reporting");
    assert.equal(passport.compositeScore, 91.75);
    assert.equal(passport.verificationBadge, "Record matches our database");

    // Strictly ensure sensitive payload and raw storage paths are NEVER in the public passport projection
    assert.equal((passport as unknown as Record<string, unknown>).storageKey, undefined);
    assert.equal((passport as unknown as Record<string, unknown>).userId, undefined);
    assert.equal((passport as unknown as Record<string, unknown>).jwsPayload, undefined);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
