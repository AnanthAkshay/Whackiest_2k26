import assert from "node:assert/strict";
import test from "node:test";
import type { Session, SkillRecord } from "../types";
import {
  isLegacyCredential,
  isLegacySession,
  mapLegacyOutcome,
  migrateLegacyCredential,
  migrateLegacySession
} from "./migration";

const legacySessionFixture = (): Session => ({
  id: "legacy-session-987",
  skill: "excel",
  language: "en",
  level: "new",
  status: "complete",
  understanding: 82,
  stalled: false,
  startedAt: "2026-11-24T10:00:00.000Z",
  updatedAt: "2026-11-24T10:08:30.000Z",
  completedAt: "2026-11-24T10:08:30.000Z",
  voiceMode: "mock",
  mockQuestionIndex: 3,
  criterionStates: [
    {
      criterionId: "formulas-functions",
      status: "correct",
      evidenceQuote: "I used SUM(A1:A10) to aggregate."
    }
  ],
  transcript: [
    {
      speaker: "agent",
      text: "Can you explain how SUM works?",
      createdAt: "2026-11-24T10:00:10.000Z"
    },
    {
      speaker: "candidate",
      text: "I used SUM(A1:A10) to aggregate.",
      createdAt: "2026-11-24T10:01:00.000Z"
    }
  ],
  meterTrace: [
    { turnIndex: 0, value: 0 },
    { turnIndex: 1, value: 82 }
  ]
});

const legacyCredentialFixture = (): SkillRecord => ({
  id: "page-abc-123",
  sessionId: "legacy-session-987",
  skill: "excel",
  language: "en",
  rubricVersion: "1.0.0",
  total: 82,
  overallLevel: "Ready to practise",
  scores: [
    {
      criterionId: "formulas-functions",
      label: "Formulas & Functions",
      status: "correct",
      score: 82,
      evidenceQuote: "I used SUM(A1:A10) to aggregate.",
      reason: "Accurate formula explanation"
    }
  ],
  meterTrace: [
    { turnIndex: 0, value: 0 },
    { turnIndex: 1, value: 82 }
  ],
  tooShort: false,
  issuedAt: "2026-11-24T10:09:00.000Z",
  name: "Priya",
  shared: true,
  seal: "hmac-sha256-legacy-seal-hex",
  basisNote:
    "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."
});

test("isLegacySession and isLegacyCredential accurately identify legacy data structures", () => {
  const session = legacySessionFixture();
  const credential = legacyCredentialFixture();

  assert.ok(isLegacySession(session));
  assert.ok(!isLegacySession(credential));

  assert.ok(isLegacyCredential(credential));
  assert.ok(!isLegacyCredential(session));
});

test("migrateLegacySession maps session to AssessmentAttempt and VivaSession preserving history", () => {
  const session = legacySessionFixture();
  const { attempt, vivaSession } = migrateLegacySession(session, "user_migrated_01");

  assert.equal(attempt.attemptId, session.id);
  assert.equal(attempt.userId, "user_migrated_01");
  assert.equal(attempt.status, "COMPLETED");
  assert.equal(attempt.isLegacy, true);
  assert.equal(attempt.legacySessionId, session.id);
  assert.equal(attempt.startedAt, session.startedAt);

  assert.equal(vivaSession.sessionId, session.id);
  assert.equal(vivaSession.language, "en");
  assert.equal(vivaSession.transcriptReference.turnCount, 2);
  assert.equal(vivaSession.transcriptReference.turns.length, 2);
  assert.equal(vivaSession.durationSeconds, 510);
});

test("migrateLegacyCredential maps SkillRecord to AssessmentResult and Credential with Demonstrated outcome", () => {
  const record = legacyCredentialFixture();
  const { result, credential } = migrateLegacyCredential(record, "user_migrated_01");

  assert.equal(result.attemptId, record.sessionId);
  assert.equal(result.composite, 82);
  assert.equal(result.outcome, "Demonstrated");
  assert.equal(result.criterionEvidence.length, 1);
  assert.equal(result.criterionEvidence[0].criterionId, "formulas-functions");

  assert.equal(credential.credentialId, record.id);
  assert.equal(credential.attemptId, record.sessionId);
  assert.equal(credential.jwsSignature, record.seal);
  assert.equal(credential.keyId, "legacy-hmac-v1");
});

test("mapLegacyOutcome appropriately handles short and low-scoring sessions", () => {
  const base = legacyCredentialFixture();

  const tooShort = { ...base, tooShort: true, total: 95 };
  assert.equal(mapLegacyOutcome(tooShort), "Not yet demonstrated");

  const partial = { ...base, total: 55, overallLevel: "Developing" as const };
  assert.equal(mapLegacyOutcome(partial), "Partially demonstrated");

  const low = { ...base, total: 20, overallLevel: "Starting" as const };
  assert.equal(mapLegacyOutcome(low), "Not yet demonstrated");
});
