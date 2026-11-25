import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFileStore } from "../store/LocalFileStore";
import { sampleConsent, sampleLearner } from "../domain/fixtures";
import type { AssessmentAttempt, AssessmentResult } from "../domain/types";
import type { SkillRecord } from "../types";
import { getPublicJwks, verifyEd25519Jws } from "./passportCrypto";
import {
  CredentialEligibilityError,
  issueSkillPassport,
  revokeSkillPassport,
  verifyPassportById,
  withdrawPassportSharing
} from "./passportService";
import { computeSeal } from "./seal";

const demonstratedResult = (attemptId: string, userId: string): AssessmentResult => ({
  resultId: "res_pass_01",
  attemptId,
  userId,
  dimensions: { P: 90, U: 85, C: 90 },
  weights: { P: 0.6, U: 0.25, C: 0.15 },
  composite: 88.75,
  outcome: "Demonstrated",
  criticalCriteriaPassed: true,
  criterionEvidence: [],
  reviewFlags: [],
  skillRubricVersion: "1.0.0",
  challengeRubricVersion: "1.0.0",
  evaluatedAt: "2026-11-25T00:10:00.000Z"
});

const baseAttempt = (userId: string): AssessmentAttempt => ({
  attemptId: "att_pass_01",
  userId,
  challengeId: "retail_sales_cleanup",
  seedId: "seed_01",
  skillRubricVersion: "1.0.0",
  challengeRubricVersion: "1.0.0",
  status: "COMPLETED",
  startedAt: "2026-11-25T00:00:00.000Z",
  updatedAt: "2026-11-25T00:10:00.000Z"
});

const sampleHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

test("Skill Passport Ed25519 JWS: valid signature, tampered payload, wrong kid, and JWKS public-only", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-passport-"));
  try {
    const store = new LocalFileStore(dir);
    await store.saveLearnerProfile(sampleLearner);
    await store.saveConsent(sampleConsent); // publicSharingConsent: true
    const attempt = baseAttempt(sampleLearner.userId);
    await store.createAttempt(attempt);
    const result = demonstratedResult(attempt.attemptId, sampleLearner.userId);
    await store.saveAssessmentResult(result);

    const cred = await issueSkillPassport({
      store,
      result,
      attempt,
      learner: sampleLearner,
      evidenceHash: sampleHash
    });

    // 1. Valid signature & public verification
    const verified = await verifyPassportById(store, cred.credentialId);
    assert.equal(verified.found, true);
    assert.equal(verified.valid, true);
    assert.equal(verified.verificationType, "ed25519-jws");
    assert.equal(verified.status, "active");
    assert.match(verified.meaningDisclaimer, /Neither proves who authored the file/);

    // 2. Modified payload fails verification
    const parts = cred.jwsSignature.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ ...cred.jwsPayload, outcome: "Tampered" })).toString("base64url");
    const tamperedJws = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const tamperedCheck = verifyEd25519Jws(tamperedJws);
    assert.equal(tamperedCheck.valid, false);

    // 3. Wrong key ID fails verification
    const wrongHeader = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "JWT", kid: "unknown-kid-999" })).toString("base64url");
    const wrongKidJws = `${wrongHeader}.${parts[1]}.${parts[2]}`;
    const wrongKidCheck = verifyEd25519Jws(wrongKidJws);
    assert.equal(wrongKidCheck.valid, false);
    assert.match(wrongKidCheck.reason ?? "", /Unknown verification key ID/);

    // 4. JWKS publishes only public key (no private key 'd' parameter)
    const jwks = getPublicJwks();
    assert.equal(jwks.keys.length, 1);
    assert.equal(jwks.keys[0].crv, "Ed25519");
    assert.equal((jwks.keys[0] as unknown as Record<string, unknown>).d, undefined);

    // 5. Unknown credential returns found=false
    const unknown = await verifyPassportById(store, "nonexistent_passport_id");
    assert.equal(unknown.found, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Skill Passport lifecycle: revocation, private default, and withdrawn share link", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-passport-life-"));
  try {
    const store = new LocalFileStore(dir);
    await store.saveLearnerProfile(sampleLearner);
    // Start private (publicSharingConsent: false)
    await store.saveConsent({ ...sampleConsent, publicSharingConsent: false });
    const attempt = baseAttempt(sampleLearner.userId);
    await store.createAttempt(attempt);
    const result = demonstratedResult(attempt.attemptId, sampleLearner.userId);
    await store.saveAssessmentResult(result);

    const cred = await issueSkillPassport({
      store,
      result,
      attempt,
      learner: sampleLearner,
      evidenceHash: sampleHash
    });

    // Private passport is not publicly exposed
    const privateCheck = await verifyPassportById(store, cred.credentialId);
    assert.equal(privateCheck.found, false);
    assert.equal(privateCheck.privateOrWithdrawn, true);

    // Enable sharing -> becomes publicly verifiable
    await store.saveConsent({ ...sampleConsent, publicSharingConsent: true });
    const publicCheck = await verifyPassportById(store, cred.credentialId);
    assert.equal(publicCheck.found, true);
    assert.equal(publicCheck.valid, true);

    // Withdraw sharing -> immediately hidden again
    await withdrawPassportSharing(store, sampleLearner.userId, cred.credentialId);
    const withdrawnCheck = await verifyPassportById(store, cred.credentialId);
    assert.equal(withdrawnCheck.found, false);
    assert.equal(withdrawnCheck.privateOrWithdrawn, true);

    // Re-enable sharing and test Revocation
    await store.saveConsent({ ...sampleConsent, publicSharingConsent: true });
    await revokeSkillPassport(store, cred.credentialId, {
      actor: "admin_audit",
      reason: "Superseded by re-assessment"
    });
    const revokedCheck = await verifyPassportById(store, cred.credentialId);
    assert.equal(revokedCheck.found, true);
    assert.equal(revokedCheck.valid, false);
    assert.equal(revokedCheck.status, "revoked");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Credential eligibility: no credential issued for Partially demonstrated or Pending Human Review", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-passport-elig-"));
  try {
    const store = new LocalFileStore(dir);
    const attempt = baseAttempt(sampleLearner.userId);
    const partial = { ...demonstratedResult(attempt.attemptId, sampleLearner.userId), outcome: "Partially demonstrated" as const };
    const review = { ...demonstratedResult(attempt.attemptId, sampleLearner.userId), outcome: "Pending Human Review" as const };

    await assert.rejects(
      async () => await issueSkillPassport({ store, result: partial, attempt, learner: sampleLearner, evidenceHash: sampleHash }),
      CredentialEligibilityError
    );
    await assert.rejects(
      async () => await issueSkillPassport({ store, result: review, attempt, learner: sampleLearner, evidenceHash: sampleHash }),
      CredentialEligibilityError
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Legacy HMAC record is verified strictly as 'legacy record-integrity check'", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-passport-legacy-"));
  try {
    const store = new LocalFileStore(dir);
    const legacyRecord: SkillRecord = {
      id: "legacy_page_01",
      sessionId: "sess_legacy_01",
      skill: "excel",
      language: "en",
      rubricVersion: "1.0.0",
      total: 85,
      overallLevel: "Ready to practise",
      scores: [],
      meterTrace: [],
      tooShort: false,
      issuedAt: "2026-11-24T00:00:00.000Z",
      shared: true
    };
    legacyRecord.seal = computeSeal(legacyRecord);
    await store.saveCredential(legacyRecord);

    const res = await verifyPassportById(store, legacyRecord.id);
    assert.equal(res.found, true);
    assert.equal(res.valid, true);
    assert.equal(res.verificationType, "legacy-hmac-record-integrity");
    assert.equal(res.legacyLabel, "legacy record-integrity check");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
