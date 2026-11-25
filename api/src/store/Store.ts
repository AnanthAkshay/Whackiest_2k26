import type { Session, SkillRecord } from "../types";
import type {
  AssessmentAttempt,
  AssessmentResult,
  AuditEvent,
  Challenge,
  ConsentRecord,
  Credential,
  EvidenceArtifact,
  LearnerProfile,
  LearningResource,
  Opportunity,
  PublicPassportProjection,
  Role,
  ValidationReport,
  VivaSession
} from "../domain/types";

export class UnauthorizedAccessError extends Error {
  constructor(message = "Unauthorized: learner cannot access another learner's private records") {
    super(message);
    this.name = "UnauthorizedAccessError";
  }
}

export interface Store {
  // Legacy Session & Credential methods
  createSession(session: Session): Promise<void>;
  getSession(id: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
  listSessions(): Promise<Session[]>;
  saveCredential(record: SkillRecord): Promise<void>;
  getCredential(pageId: string): Promise<SkillRecord | undefined>;
  deleteCredential(pageId: string): Promise<void>;

  // Learner Profile & Consent
  saveLearnerProfile(profile: LearnerProfile): Promise<void>;
  getLearnerProfile(userId: string): Promise<LearnerProfile | undefined>;
  saveConsent(consent: ConsentRecord): Promise<void>;
  getConsent(userId: string): Promise<ConsentRecord | undefined>;

  // Role & Challenge Catalogue
  saveRole(role: Role): Promise<void>;
  getRole(roleId: string): Promise<Role | undefined>;
  listRoles(): Promise<Role[]>;
  saveChallenge(challenge: Challenge): Promise<void>;
  getChallenge(challengeId: string): Promise<Challenge | undefined>;
  listChallenges(roleId?: string): Promise<Challenge[]>;

  // Assessment Attempt
  createAttempt(attempt: AssessmentAttempt): Promise<AssessmentAttempt>;
  getAttempt(attemptId: string, requestedByUserId?: string): Promise<AssessmentAttempt | undefined>;
  saveAttempt(attempt: AssessmentAttempt): Promise<void>;
  listAttempts(userId?: string): Promise<AssessmentAttempt[]>;

  // Evidence & Validation
  saveEvidenceArtifact(artifact: EvidenceArtifact): Promise<EvidenceArtifact>;
  getEvidenceArtifact(artifactId: string, requestedByUserId?: string): Promise<EvidenceArtifact | undefined>;
  saveValidationReport(report: ValidationReport): Promise<ValidationReport>;
  getValidationReport(reportId: string, requestedByUserId?: string): Promise<ValidationReport | undefined>;

  // Viva Session
  saveVivaSession(viva: VivaSession): Promise<void>;
  getVivaSession(sessionId: string, requestedByUserId?: string): Promise<VivaSession | undefined>;

  // Assessment Result & Credential
  saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult>;
  getAssessmentResult(resultId: string, requestedByUserId?: string): Promise<AssessmentResult | undefined>;
  saveCredentialV2(credential: Credential): Promise<Credential>;
  getCredentialV2(credentialId: string, requestedByUserId?: string): Promise<Credential | undefined>;
  getPublicPassport(credentialId: string): Promise<PublicPassportProjection | undefined>;

  // Opportunity & Resources
  saveOpportunity(opportunity: Opportunity): Promise<void>;
  listOpportunities(options?: { activeOnly?: boolean }): Promise<Opportunity[]>;
  saveLearningResource(resource: LearningResource): Promise<void>;
  listLearningResources(roleId?: string): Promise<LearningResource[]>;

  // Audit Events
  recordAuditEvent(event: AuditEvent): Promise<void>;
  listAuditEvents(entityId?: string): Promise<AuditEvent[]>;
}
