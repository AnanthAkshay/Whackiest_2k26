import type { Session, SkillRecord } from "../types";
import type {
  AssessmentAttempt,
  AssessmentOutcome,
  AssessmentResult,
  Credential,
  CriterionEvidence,
  VivaSession
} from "./types";

export interface MigratedSessionResult {
  attempt: AssessmentAttempt;
  vivaSession: VivaSession;
}

export interface MigratedCredentialResult {
  result: AssessmentResult;
  credential: Credential;
}

export function isLegacySession(session: unknown): session is Session {
  if (!session || typeof session !== "object") return false;
  const s = session as Record<string, unknown>;
  return typeof s.id === "string" && typeof s.skill === "string" && Array.isArray(s.transcript);
}

export function isLegacyCredential(record: unknown): record is SkillRecord {
  if (!record || typeof record !== "object") return false;
  const r = record as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.sessionId === "string" && typeof r.total === "number";
}

export function mapLegacyOutcome(record: SkillRecord): AssessmentOutcome {
  if (record.tooShort) return "Not yet demonstrated";
  if (record.total >= 75 && record.overallLevel === "Ready to practise") {
    return "Demonstrated";
  }
  if (record.total >= 40) {
    return "Partially demonstrated";
  }
  return "Not yet demonstrated";
}

export function migrateLegacySession(
  session: Session,
  defaultUserId = "legacy_user"
): MigratedSessionResult {
  const attemptStatus =
    session.status === "complete"
      ? "COMPLETED"
      : session.transcript.length > 0
      ? "VIVA_ACTIVE"
      : "VIVA_PENDING";

  const startTime = Date.parse(session.startedAt) || Date.now();
  const updateTime = Date.parse(session.updatedAt) || startTime;
  const durationSeconds = Math.max(0, Math.round((updateTime - startTime) / 1000));

  const attempt: AssessmentAttempt = {
    attemptId: session.id,
    userId: defaultUserId,
    challengeId: "retail_sales_cleanup",
    seedId: "seed_retail_legacy",
    skillRubricVersion: "1.0.0",
    challengeRubricVersion: "1.0.0",
    status: attemptStatus,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    completedAt: session.completedAt,
    isLegacy: true,
    legacySessionId: session.id
  };

  const vivaSession: VivaSession = {
    sessionId: session.id,
    attemptId: session.id,
    userId: defaultUserId,
    language: session.language,
    status: session.status === "complete" ? "complete" : "active",
    providerConfig: {
      provider: session.voiceMode === "elevenlabs" ? "elevenlabs" : "mock",
      voiceMode: session.voiceMode
    },
    transcriptReference: {
      turnCount: session.transcript.length,
      turns: session.transcript.map((turn) => ({
        speaker: turn.speaker,
        text: turn.text,
        createdAt: turn.createdAt
      }))
    },
    durationSeconds,
    startedAt: session.startedAt,
    endedAt: session.completedAt
  };

  return { attempt, vivaSession };
}

export function migrateLegacyCredential(
  record: SkillRecord,
  defaultUserId = "legacy_user"
): MigratedCredentialResult {
  const outcome = mapLegacyOutcome(record);

  const criterionEvidence: CriterionEvidence[] = (record.scores ?? []).map((score) => ({
    criterionId: score.criterionId,
    dimension: "U",
    status: score.status,
    score: score.score,
    evidenceQuote: score.evidenceQuote,
    reason: score.reason
  }));

  const resultId = `res_${record.id}`;

  const result: AssessmentResult = {
    resultId,
    attemptId: record.sessionId,
    userId: defaultUserId,
    dimensions: {
      P: record.total, // backward compatibility projection
      U: record.total,
      C: record.total
    },
    weights: {
      P: 0.6,
      U: 0.25,
      C: 0.15
    },
    composite: record.total,
    outcome,
    criticalCriteriaPassed: outcome === "Demonstrated",
    criterionEvidence,
    reviewFlags: [],
    skillRubricVersion: record.rubricVersion || "1.0.0",
    challengeRubricVersion: "1.0.0",
    evaluatedAt: record.issuedAt
  };

  const credential: Credential = {
    credentialId: record.id,
    resultId,
    attemptId: record.sessionId,
    userId: defaultUserId,
    jwsPayload: {
      legacySeal: record.seal,
      legacySkill: record.skill,
      legacyLevel: record.overallLevel,
      basisNote: record.basisNote,
      name: record.name,
      total: record.total
    },
    jwsSignature: record.seal || "legacy-hmac-placeholder-signature",
    keyId: "legacy-hmac-v1",
    evidenceHash: "0000000000000000000000000000000000000000000000000000000000000000",
    status: "active",
    issuedAt: record.issuedAt
  };

  return { result, credential };
}
