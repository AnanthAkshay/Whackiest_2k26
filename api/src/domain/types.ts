import type { Language, CriterionStatus } from "../types";

// ==========================================
// 1. Learner Profile & Consent
// ==========================================

export interface CoarseLocation {
  country: string;
  state: string;
  district?: string;
  city?: string;
}

export interface LearnerProfile {
  userId: string;
  publicHandle: string;
  displayName: string;
  preferredLanguage: Language;
  careerGoal: string;
  coarseLocation: CoarseLocation;
  createdAt: string;
  updatedAt?: string;
}

export interface ConsentRecord {
  consentId: string;
  userId: string;
  policyVersion: string;
  aiProcessingConsent: boolean;
  voiceRetentionConsent: boolean;
  rawAudioRetentionConsent?: boolean; // strictly false by default
  publicSharingConsent: boolean;
  grantedAt: string;
  withdrawnAt?: string | null;
}

// ==========================================
// 2. Canonical Role, Skill & RoleSkill
// ==========================================

export interface Skill {
  skillId: string;
  name: string;
  category: string;
  description: string;
  version: string;
}

export interface RoleSkill {
  roleId: string;
  skillId: string;
  weight: number; // e.g. 0.35 (normalized)
  criticalFlag: boolean; // if true, must pass to demonstrate role
  minimumScore?: number;
}

export interface Role {
  roleId: string;
  title: string;
  description: string;
  sector: string;
  version: string;
  skills: RoleSkill[];
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// 3. Challenge, Dataset Seed & Rubrics
// ==========================================

export interface ChallengeExpectedOutputs {
  expectedRows?: number;
  requiredColumns: string[];
  requiredFormulas: string[];
}

export interface Challenge {
  challengeId: string;
  roleId: string;
  title: string;
  description: string;
  version: string;
  taskPrompt: string;
  allowedFormats: string[]; // e.g. [".xlsx"]
  skillRubricId: string;
  challengeRubricId: string;
  expectedOutputs: ChallengeExpectedOutputs;
  createdAt: string;
}

export interface DatasetSeed {
  seedId: string;
  challengeId: string;
  version: string;
  generationConfig: Record<string, unknown>;
  storageKey: string;
  sha256: string;
  expectedOutputs: Record<string, unknown>;
  createdAt: string;
}

export interface ConceptualCriterion {
  id: string;
  name: string;
  weight: number;
  whatCorrectCovers: string[];
  commonMisconceptions: string[];
  followUpProbes: Array<{ level: "easy" | "medium" | "deep"; question: string }>;
}

export interface SkillRubricDomain {
  skillId: string;
  version: string;
  basisNote: string;
  trainerCoSigned: boolean;
  criteria: ConceptualCriterion[];
}

export interface ObjectiveCheckDefinition {
  checkId: string;
  name: string;
  weight: number;
  critical: boolean;
  description: string;
}

export interface ChallengeRubric {
  challengeRubricId: string;
  challengeId: string;
  version: string;
  checks: ObjectiveCheckDefinition[];
  createdAt: string;
}

// ==========================================
// 4. Assessment Attempt & State Machine
// ==========================================

export type AttemptStatus =
  | "DRAFT"
  | "QUEUED"
  | "VALIDATING"
  | "VIVA_PENDING"
  | "VIVA_ACTIVE"
  | "SCORING"
  | "PENDING_REVIEW"
  | "COMPLETED"
  | "FAILED";

export interface AssessmentAttempt {
  attemptId: string;
  userId: string;
  challengeId: string;
  seedId: string;
  skillRubricVersion: string;
  challengeRubricVersion: string;
  status: AttemptStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  idempotencyKey?: string;
  isLegacy?: boolean;
  legacySessionId?: string;
}

// ==========================================
// 5. Evidence Artifact & Validation Report
// ==========================================

export interface EvidenceArtifact {
  artifactId: string;
  attemptId: string;
  userId: string;
  storageKey: string;
  mimeType: string;
  size: number;
  sha256: string;
  uploadTime: string;
  idempotencyKey?: string;
}

export interface ObjectiveCheckResult {
  checkId: string;
  description: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details?: string;
}

export interface ValidationReport {
  reportId: string;
  attemptId: string;
  userId: string;
  artifactId: string;
  validatorVersion: string;
  practicalScore: number; // 0-100 (P)
  checks: ObjectiveCheckResult[];
  factIds: string[];
  warnings: string[];
  createdAt: string;
  idempotencyKey?: string;
}

// ==========================================
// 6. Viva Session & Transcript
// ==========================================

export interface VivaTurn {
  speaker: "candidate" | "agent";
  text: string;
  createdAt: string;
}

export interface VivaSession {
  sessionId: string;
  attemptId: string;
  userId: string;
  language: Language;
  status: "active" | "complete" | "abandoned";
  providerConfig: {
    provider: "elevenlabs" | "mock";
    agentId?: string;
    voiceMode: "elevenlabs" | "mock";
  };
  transcriptReference: {
    turnCount: number;
    turns: VivaTurn[];
    transcriptKey?: string;
  };
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
}

// ==========================================
// 7. ECVE Assessment Result & Credential
// ==========================================

export type AssessmentOutcome =
  | "Not yet demonstrated"
  | "Partially demonstrated"
  | "Demonstrated"
  | "Pending Human Review";

export interface CriterionEvidence {
  criterionId: string;
  dimension: "P" | "U" | "C";
  status: CriterionStatus;
  score: number;
  evidenceQuote: string;
  reason: string;
}

export interface ReviewFlag {
  code: string;
  message: string;
  severity: "low" | "medium" | "high";
  triggeredAt: string;
}

export interface AssessmentResult {
  resultId: string;
  attemptId: string;
  userId: string;
  dimensions: {
    P: number; // 0-100 Practical Execution
    U: number; // 0-100 Conceptual Understanding
    C: number; // 0-100 Evidence Consistency
  };
  weights: {
    P: number; // default 0.60
    U: number; // default 0.25
    C: number; // default 0.15
  };
  composite: number; // 0.60P + 0.25U + 0.15C
  outcome: AssessmentOutcome;
  criticalCriteriaPassed: boolean;
  criterionEvidence: CriterionEvidence[];
  reviewFlags: ReviewFlag[];
  skillRubricVersion: string;
  challengeRubricVersion: string;
  evaluatedAt: string;
  idempotencyKey?: string;
}

export interface Credential {
  credentialId: string;
  resultId: string;
  attemptId: string;
  userId: string;
  jwsPayload: Record<string, unknown>;
  jwsSignature: string;
  keyId: string;
  evidenceHash: string; // SHA-256 of artifact
  status: "active" | "revoked" | "superseded";
  issuedAt: string;
  revocationData?: {
    revokedAt: string;
    reason: string;
  };
  idempotencyKey?: string;
}

// ==========================================
// 8. Public Passport Projection (Separated)
// ==========================================

export interface PublicPassportProjection {
  passportId: string;
  publicHandle: string;
  displayName?: string;
  roleTitle: string;
  challengeTitle: string;
  compositeScore: number;
  dimensions: {
    practicalExecution: number;
    conceptualUnderstanding: number;
    evidenceConsistency: number;
  };
  outcome: AssessmentOutcome;
  evidenceHash: string;
  issuedAt: string;
  rubricBasis: string;
  verificationBadge: "Record matches our database";
  jwsSignature: string;
  status: "active" | "revoked" | "superseded";
}

// ==========================================
// 9. Opportunity & Matching
// ==========================================

export interface OpportunityRequiredSkill {
  skillId: string;
  weight: number;
  minimumScore?: number;
}

export interface Opportunity {
  opportunityId: string;
  title: string;
  employer: string;
  sourceUrl: string;
  district: string;
  location: string;
  requiredSkills: OpportunityRequiredSkill[];
  listingStatus: "active" | "closed" | "expired";
  isSample: boolean; // clearly labelled sample vs live
  postedDate: string;
  updatedAt: string;
}

// ==========================================
// 10. Learning Resource & Audit Event
// ==========================================

export interface LearningResource {
  resourceId: string;
  roleId?: string;
  skillId?: string;
  title: string;
  type: "micro_lesson" | "drill" | "external_link";
  contentMarkdown?: string;
  externalUrl?: string; // e.g. tryb link
  estimatedMinutes: number;
}

export interface AuditEvent {
  eventId: string;
  entityType: "attempt" | "artifact" | "credential" | "consent" | "user" | "result";
  entityId: string;
  userId?: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
}
