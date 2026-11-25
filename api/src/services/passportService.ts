import { randomUUID } from "node:crypto";
import { config } from "../config";
import type {
  AssessmentAttempt,
  AssessmentResult,
  ConsentRecord,
  Credential,
  LearnerProfile,
  PublicPassportProjection
} from "../domain/types";
import type { Store } from "../store/Store";
import { getActiveSigningKeyPair, signEd25519Jws, verifyEd25519Jws } from "./passportCrypto";
import { computeSeal } from "./seal";

export const VERIFICATION_MEANING_DISCLAIMER =
  "Signature verification proves issuer/integrity and status; the SHA-256 hash binds the credential to the assessed file. Neither proves who authored the file, trainer approval, government accreditation, or job performance.";

export const RUBRIC_BASIS_NOTE =
  "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot.";

export class CredentialEligibilityError extends Error {
  constructor(outcome: string) {
    super(`Credential cannot be issued for outcome '${outcome}'. Only authoritative 'Demonstrated' outcomes are eligible.`);
    this.name = "CredentialEligibilityError";
  }
}

export async function issueSkillPassport(params: {
  store: Store;
  result: AssessmentResult;
  attempt: AssessmentAttempt;
  learner: LearnerProfile;
  evidenceHash: string;
  skill?: string;
  roleTitle?: string;
  challengeTitle?: string;
  idempotencyKey?: string;
}): Promise<Credential> {
  const { store, result, attempt, learner, evidenceHash, idempotencyKey } = params;

  if (result.outcome !== "Demonstrated" || !result.criticalCriteriaPassed) {
    throw new CredentialEligibilityError(result.outcome);
  }

  const keyPair = getActiveSigningKeyPair();
  const credentialId = `pass_${randomUUID().slice(0, 12)}`;
  const issuedAt = new Date().toISOString();

  const jwsPayload: Record<string, unknown> = {
    credentialId,
    iss: config.passportIssuer,
    sub: learner.publicHandle,
    skill: params.skill ?? "excel",
    role: params.roleTitle ?? "Entry-Level Data Entry Operator",
    challenge: params.challengeTitle ?? "Retail Sales Cleanup & Reporting",
    assessmentMethod: "ECVE-v1",
    rubricVersions: {
      skillRubricVersion: result.skillRubricVersion,
      challengeRubricVersion: result.challengeRubricVersion
    },
    ecve: {
      P: result.dimensions.P,
      U: result.dimensions.U,
      C: result.dimensions.C,
      composite: result.composite
    },
    outcome: result.outcome,
    evidenceHash,
    issuedAt,
    status: "active",
    kid: keyPair.kid
  };

  const jwsSignature = signEd25519Jws(jwsPayload, keyPair);

  const credential: Credential = {
    credentialId,
    resultId: result.resultId,
    attemptId: attempt.attemptId,
    userId: learner.userId,
    jwsPayload,
    jwsSignature,
    keyId: keyPair.kid,
    evidenceHash,
    status: "active",
    issuedAt,
    idempotencyKey
  };

  const saved = await store.saveCredentialV2(credential);

  await store.recordAuditEvent({
    eventId: `evt_${randomUUID().slice(0, 10)}`,
    entityType: "credential",
    entityId: saved.credentialId,
    userId: learner.userId,
    action: "PASSPORT_ISSUED",
    details: {
      keyId: saved.keyId,
      evidenceHash: saved.evidenceHash,
      composite: result.composite,
      isMockDevKey: keyPair.isMockDevKey
    },
    timestamp: issuedAt
  });

  return saved;
}

export async function revokeSkillPassport(
  store: Store,
  credentialId: string,
  details: { actor: string; reason: string; status?: "revoked" | "superseded" }
): Promise<Credential> {
  const existing = await store.getCredentialV2(credentialId);
  if (!existing) {
    throw new Error(`Credential '${credentialId}' not found.`);
  }
  const now = new Date().toISOString();
  const nextStatus = details.status ?? "revoked";

  const updated: Credential = {
    ...existing,
    status: nextStatus,
    revocationData: {
      revokedAt: now,
      reason: details.reason
    }
  };

  // Re-save updated status directly (status mutation is allowed; idempotencyKey stripped for update)
  const { idempotencyKey: _idem, ...withoutIdem } = updated;
  await store.saveCredentialV2(withoutIdem);

  await store.recordAuditEvent({
    eventId: `evt_${randomUUID().slice(0, 10)}`,
    entityType: "credential",
    entityId: credentialId,
    userId: existing.userId,
    action: nextStatus === "revoked" ? "PASSPORT_REVOKED" : "PASSPORT_SUPERSEDED",
    details: { actor: details.actor, reason: details.reason, status: nextStatus },
    timestamp: now
  });

  return withoutIdem;
}

export async function withdrawPassportSharing(
  store: Store,
  userId: string,
  credentialId: string
): Promise<ConsentRecord> {
  const current = await store.getConsent(userId);
  const now = new Date().toISOString();
  const updated: ConsentRecord = current
    ? { ...current, publicSharingConsent: false, withdrawnAt: now }
    : {
        consentId: `consent_${randomUUID().slice(0, 8)}`,
        userId,
        policyVersion: "2026.1",
        aiProcessingConsent: true,
        voiceRetentionConsent: false,
        publicSharingConsent: false,
        grantedAt: now,
        withdrawnAt: now
      };

  await store.saveConsent(updated);
  await store.recordAuditEvent({
    eventId: `evt_${randomUUID().slice(0, 10)}`,
    entityType: "consent",
    entityId: credentialId,
    userId,
    action: "PASSPORT_SHARING_WITHDRAWN",
    details: { withdrawnAt: now },
    timestamp: now
  });
  return updated;
}

export interface VerificationResult {
  found: boolean;
  privateOrWithdrawn?: boolean;
  valid: boolean;
  verificationType?: "ed25519-jws" | "legacy-hmac-record-integrity";
  legacyLabel?: string;
  status?: "active" | "revoked" | "superseded";
  issuer?: string;
  keyId?: string;
  evidenceHash?: string;
  reason?: string;
  isMockDevKey?: boolean;
  meaningDisclaimer: string;
  projection?: PublicPassportProjection;
}

export async function verifyPassportById(
  store: Store,
  credentialId: string
): Promise<VerificationResult> {
  const credV2 = await store.getCredentialV2(credentialId);

  if (credV2 && credV2.keyId !== "legacy-hmac-v1") {
    // Private by default: only publicly verifiable when publicSharingConsent is explicitly true
    const consent = await store.getConsent(credV2.userId);
    if (!consent?.publicSharingConsent) {
      return {
        found: false,
        privateOrWithdrawn: true,
        valid: false,
        meaningDisclaimer: VERIFICATION_MEANING_DISCLAIMER
      };
    }

    const sigCheck = verifyEd25519Jws(credV2.jwsSignature, config.passportIssuer);
    const isActive = credV2.status === "active";
    const keyMatches = sigCheck.header?.kid === credV2.keyId;
    const valid = Boolean(sigCheck.valid && isActive && keyMatches);

    const reason = !sigCheck.valid
      ? sigCheck.reason
      : !keyMatches
      ? "Credential keyId mismatch."
      : !isActive
      ? `Credential is ${credV2.status}: ${credV2.revocationData?.reason ?? "no longer active"}.`
      : undefined;

    const projection = await store.getPublicPassport(credentialId);

    return {
      found: true,
      valid,
      verificationType: "ed25519-jws",
      status: credV2.status,
      issuer: config.passportIssuer,
      keyId: credV2.keyId,
      evidenceHash: credV2.evidenceHash,
      reason,
      isMockDevKey: credV2.keyId.startsWith("dev-mock-"),
      meaningDisclaimer: VERIFICATION_MEANING_DISCLAIMER,
      projection
    };
  }

  // Fallback to legacy HMAC SkillRecord (never claim it was upgraded to Ed25519)
  const legacyRecord = await store.getCredential(credentialId);
  if (!legacyRecord || !legacyRecord.shared) {
    return {
      found: false,
      valid: false,
      meaningDisclaimer: VERIFICATION_MEANING_DISCLAIMER
    };
  }

  const expectedSeal = computeSeal(legacyRecord);
  const valid = expectedSeal === legacyRecord.seal;

  return {
    found: true,
    valid,
    verificationType: "legacy-hmac-record-integrity",
    legacyLabel: "legacy record-integrity check",
    status: "active",
    meaningDisclaimer: VERIFICATION_MEANING_DISCLAIMER
  };
}
