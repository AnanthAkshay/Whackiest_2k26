import { z } from "zod";

export const coarseLocationSchema = z.object({
  country: z.string().min(1),
  state: z.string().min(1),
  district: z.string().optional(),
  city: z.string().optional()
});

export const learnerProfileSchema = z.object({
  userId: z.string().min(1),
  publicHandle: z.string().min(2).max(40),
  displayName: z.string().min(1).max(100),
  preferredLanguage: z.enum(["en", "hi", "kn"]),
  careerGoal: z.string().max(200),
  coarseLocation: coarseLocationSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).optional()
});

export const consentRecordSchema = z.object({
  consentId: z.string().min(1),
  userId: z.string().min(1),
  policyVersion: z.string().min(1),
  aiProcessingConsent: z.boolean(),
  voiceRetentionConsent: z.boolean(),
  rawAudioRetentionConsent: z.boolean().default(false),
  publicSharingConsent: z.boolean(),
  grantedAt: z.string().datetime({ offset: true }),
  withdrawnAt: z.string().datetime({ offset: true }).nullable().optional()
});

export const skillSchema = z.object({
  skillId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string(),
  version: z.string().min(1)
});

export const roleSkillSchema = z.object({
  roleId: z.string().min(1),
  skillId: z.string().min(1),
  weight: z.number().min(0).max(1),
  criticalFlag: z.boolean(),
  minimumScore: z.number().min(0).max(100).optional()
});

export const roleSchema = z.object({
  roleId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  sector: z.string(),
  version: z.string().min(1),
  skills: z.array(roleSkillSchema),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).optional()
});

export const challengeExpectedOutputsSchema = z.object({
  expectedRows: z.number().optional(),
  requiredColumns: z.array(z.string()),
  requiredFormulas: z.array(z.string())
});

export const challengeSchema = z.object({
  challengeId: z.string().min(1),
  roleId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  version: z.string().min(1),
  taskPrompt: z.string(),
  allowedFormats: z.array(z.string()).min(1),
  skillRubricId: z.string().min(1),
  challengeRubricId: z.string().min(1),
  expectedOutputs: challengeExpectedOutputsSchema,
  createdAt: z.string().datetime({ offset: true })
});

export const datasetSeedSchema = z.object({
  seedId: z.string().min(1),
  challengeId: z.string().min(1),
  version: z.string().min(1),
  generationConfig: z.record(z.unknown()),
  storageKey: z.string().min(1),
  sha256: z.string().length(64),
  expectedOutputs: z.record(z.unknown()),
  createdAt: z.string().datetime({ offset: true })
});

export const attemptStatusSchema = z.enum([
  "DRAFT",
  "QUEUED",
  "VALIDATING",
  "VIVA_PENDING",
  "VIVA_ACTIVE",
  "SCORING",
  "PENDING_REVIEW",
  "COMPLETED",
  "FAILED"
]);

export const assessmentAttemptSchema = z.object({
  attemptId: z.string().min(1),
  userId: z.string().min(1),
  challengeId: z.string().min(1),
  seedId: z.string().min(1),
  skillRubricVersion: z.string().min(1),
  challengeRubricVersion: z.string().min(1),
  status: attemptStatusSchema,
  startedAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
  idempotencyKey: z.string().optional(),
  isLegacy: z.boolean().optional(),
  legacySessionId: z.string().optional()
});

export const evidenceArtifactSchema = z.object({
  artifactId: z.string().min(1),
  attemptId: z.string().min(1),
  userId: z.string().min(1),
  storageKey: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().nonnegative(),
  sha256: z.string().length(64),
  uploadTime: z.string().datetime({ offset: true }),
  idempotencyKey: z.string().optional()
});

export const objectiveCheckResultSchema = z.object({
  checkId: z.string().min(1),
  description: z.string(),
  passed: z.boolean(),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  details: z.string().optional()
});

export const validationReportSchema = z.object({
  reportId: z.string().min(1),
  attemptId: z.string().min(1),
  userId: z.string().min(1),
  artifactId: z.string().min(1),
  validatorVersion: z.string().min(1),
  practicalScore: z.number().min(0).max(100),
  checks: z.array(objectiveCheckResultSchema),
  factIds: z.array(z.string()),
  warnings: z.array(z.string()),
  createdAt: z.string().datetime({ offset: true }),
  idempotencyKey: z.string().optional()
});

export const vivaTurnSchema = z.object({
  speaker: z.enum(["candidate", "agent"]),
  text: z.string(),
  createdAt: z.string().datetime({ offset: true })
});

export const vivaSessionSchema = z.object({
  sessionId: z.string().min(1),
  attemptId: z.string().min(1),
  userId: z.string().min(1),
  language: z.enum(["en", "hi", "kn"]),
  status: z.enum(["active", "complete", "abandoned"]),
  providerConfig: z.object({
    provider: z.enum(["elevenlabs", "mock"]),
    agentId: z.string().optional(),
    voiceMode: z.enum(["elevenlabs", "mock"])
  }),
  transcriptReference: z.object({
    turnCount: z.number().nonnegative(),
    turns: z.array(vivaTurnSchema),
    transcriptKey: z.string().optional()
  }),
  durationSeconds: z.number().nonnegative(),
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).optional()
});

export const assessmentOutcomeSchema = z.enum([
  "Not yet demonstrated",
  "Partially demonstrated",
  "Demonstrated",
  "Pending Human Review"
]);

export const criterionEvidenceSchema = z.object({
  criterionId: z.string().min(1),
  dimension: z.enum(["P", "U", "C"]),
  status: z.enum(["not_covered", "wrong", "partial", "correct"]),
  score: z.number().min(0).max(100),
  evidenceQuote: z.string(),
  reason: z.string()
});

export const reviewFlagSchema = z.object({
  code: z.string().min(1),
  message: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  triggeredAt: z.string().datetime({ offset: true })
});

export const assessmentResultSchema = z.object({
  resultId: z.string().min(1),
  attemptId: z.string().min(1),
  userId: z.string().min(1),
  dimensions: z.object({
    P: z.number().min(0).max(100),
    U: z.number().min(0).max(100),
    C: z.number().min(0).max(100)
  }),
  weights: z.object({
    P: z.number().min(0).max(1),
    U: z.number().min(0).max(1),
    C: z.number().min(0).max(1)
  }),
  composite: z.number().min(0).max(100),
  outcome: assessmentOutcomeSchema,
  criticalCriteriaPassed: z.boolean(),
  criterionEvidence: z.array(criterionEvidenceSchema),
  reviewFlags: z.array(reviewFlagSchema),
  skillRubricVersion: z.string().min(1),
  challengeRubricVersion: z.string().min(1),
  evaluatedAt: z.string().datetime({ offset: true }),
  idempotencyKey: z.string().optional()
});

export const credentialSchema = z.object({
  credentialId: z.string().min(1),
  resultId: z.string().min(1),
  attemptId: z.string().min(1),
  userId: z.string().min(1),
  jwsPayload: z.record(z.unknown()),
  jwsSignature: z.string().min(1),
  keyId: z.string().min(1),
  evidenceHash: z.string().length(64),
  status: z.enum(["active", "revoked", "superseded"]),
  issuedAt: z.string().datetime({ offset: true }),
  revocationData: z
    .object({
      revokedAt: z.string().datetime({ offset: true }),
      reason: z.string()
    })
    .optional(),
  idempotencyKey: z.string().optional()
});

export const opportunityRequiredSkillSchema = z.object({
  skillId: z.string().min(1),
  weight: z.number().min(0).max(1),
  minimumScore: z.number().min(0).max(100).optional()
});

export const opportunitySchema = z.object({
  opportunityId: z.string().min(1),
  title: z.string().min(1),
  employer: z.string().min(1),
  sourceUrl: z.string().url(),
  district: z.string().min(1),
  location: z.string().min(1),
  requiredSkills: z.array(opportunityRequiredSkillSchema),
  listingStatus: z.enum(["active", "closed", "expired"]),
  isSample: z.boolean(),
  postedDate: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true })
});

export const learningResourceSchema = z.object({
  resourceId: z.string().min(1),
  roleId: z.string().optional(),
  skillId: z.string().optional(),
  title: z.string().min(1),
  type: z.enum(["micro_lesson", "drill", "external_link"]),
  contentMarkdown: z.string().optional(),
  externalUrl: z.string().url().optional(),
  estimatedMinutes: z.number().positive()
});

export const auditEventSchema = z.object({
  eventId: z.string().min(1),
  entityType: z.enum(["attempt", "artifact", "credential", "consent", "user", "result"]),
  entityId: z.string().min(1),
  userId: z.string().optional(),
  action: z.string().min(1),
  details: z.record(z.unknown()),
  timestamp: z.string().datetime({ offset: true })
});

export const publicPassportProjectionSchema = z.object({
  passportId: z.string().min(1),
  publicHandle: z.string().min(1),
  displayName: z.string().optional(),
  roleTitle: z.string().min(1),
  challengeTitle: z.string().min(1),
  compositeScore: z.number().min(0).max(100),
  dimensions: z.object({
    practicalExecution: z.number().min(0).max(100),
    conceptualUnderstanding: z.number().min(0).max(100),
    evidenceConsistency: z.number().min(0).max(100)
  }),
  outcome: assessmentOutcomeSchema,
  evidenceHash: z.string().length(64),
  issuedAt: z.string().datetime({ offset: true }),
  rubricBasis: z.string().min(1),
  verificationBadge: z.literal("Record matches our database"),
  jwsSignature: z.string().min(1),
  status: z.enum(["active", "revoked", "superseded"])
});
