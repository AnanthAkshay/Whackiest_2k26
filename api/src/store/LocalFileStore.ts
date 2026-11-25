import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
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
import { migrateLegacyCredential, migrateLegacySession } from "../domain/migration";
import { type Store, UnauthorizedAccessError } from "./Store";

interface LocalDatabase {
  sessions: Record<string, Session>;
  credentials: Record<string, SkillRecord>;
  learners: Record<string, LearnerProfile>;
  consents: Record<string, ConsentRecord>;
  roles: Record<string, Role>;
  challenges: Record<string, Challenge>;
  attempts: Record<string, AssessmentAttempt>;
  artifacts: Record<string, EvidenceArtifact>;
  validationReports: Record<string, ValidationReport>;
  vivaSessions: Record<string, VivaSession>;
  assessmentResults: Record<string, AssessmentResult>;
  credentialsV2: Record<string, Credential>;
  opportunities: Record<string, Opportunity>;
  learningResources: Record<string, LearningResource>;
  auditEvents: AuditEvent[];
}

const emptyDatabase = (): LocalDatabase => ({
  sessions: {},
  credentials: {},
  learners: {},
  consents: {},
  roles: {},
  challenges: {},
  attempts: {},
  artifacts: {},
  validationReports: {},
  vivaSessions: {},
  assessmentResults: {},
  credentialsV2: {},
  opportunities: {},
  learningResources: {},
  auditEvents: []
});

export class LocalFileStore implements Store {
  private readonly filePath: string;
  private mutex: Promise<void> = Promise.resolve();

  constructor(directory: string) {
    this.filePath = join(directory, "store.json");
  }

  private withLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.mutex.then(fn, fn);
    this.mutex = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  // ==========================================
  // Legacy Session & Credential methods
  // ==========================================

  async createSession(session: Session): Promise<void> {
    const db = await this.read();
    db.sessions[session.id] = session;
    await this.write(db);
  }

  async getSession(id: string): Promise<Session | undefined> {
    return (await this.read()).sessions[id];
  }

  async saveSession(session: Session): Promise<void> {
    const db = await this.read();
    db.sessions[session.id] = session;
    await this.write(db);
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.read();
    delete db.sessions[id];
    await this.write(db);
  }

  async listSessions(): Promise<Session[]> {
    return Object.values((await this.read()).sessions);
  }

  async saveCredential(record: SkillRecord): Promise<void> {
    const db = await this.read();
    db.credentials[record.id] = record;
    await this.write(db);
  }

  async getCredential(pageId: string): Promise<SkillRecord | undefined> {
    return (await this.read()).credentials[pageId];
  }

  async deleteCredential(pageId: string): Promise<void> {
    const db = await this.read();
    delete db.credentials[pageId];
    await this.write(db);
  }

  // ==========================================
  // Learner Profile & Consent
  // ==========================================

  async saveLearnerProfile(profile: LearnerProfile): Promise<void> {
    const db = await this.read();
    db.learners[profile.userId] = profile;
    await this.write(db);
  }

  async getLearnerProfile(userId: string): Promise<LearnerProfile | undefined> {
    return (await this.read()).learners[userId];
  }

  async saveConsent(consent: ConsentRecord): Promise<void> {
    const db = await this.read();
    db.consents[consent.userId] = consent;
    await this.write(db);
  }

  async getConsent(userId: string): Promise<ConsentRecord | undefined> {
    return (await this.read()).consents[userId];
  }

  // ==========================================
  // Role & Challenge Catalogue
  // ==========================================

  async saveRole(role: Role): Promise<void> {
    const db = await this.read();
    db.roles[role.roleId] = role;
    await this.write(db);
  }

  async getRole(roleId: string): Promise<Role | undefined> {
    return (await this.read()).roles[roleId];
  }

  async listRoles(): Promise<Role[]> {
    return Object.values((await this.read()).roles);
  }

  async saveChallenge(challenge: Challenge): Promise<void> {
    const db = await this.read();
    db.challenges[challenge.challengeId] = challenge;
    await this.write(db);
  }

  async getChallenge(challengeId: string): Promise<Challenge | undefined> {
    return (await this.read()).challenges[challengeId];
  }

  async listChallenges(roleId?: string): Promise<Challenge[]> {
    const all = Object.values((await this.read()).challenges);
    return roleId ? all.filter((c) => c.roleId === roleId) : all;
  }

  // ==========================================
  // Assessment Attempt (with Idempotency & Privacy)
  // ==========================================

  async createAttempt(attempt: AssessmentAttempt): Promise<AssessmentAttempt> {
    return this.withLock(async () => {
      const db = await this.read();
      if (attempt.idempotencyKey) {
        const existing = Object.values(db.attempts).find(
          (a) => a.idempotencyKey === attempt.idempotencyKey && a.userId === attempt.userId
        );
        if (existing) return existing;
      }
      db.attempts[attempt.attemptId] = attempt;
      await this.write(db);
      return attempt;
    });
  }

  async getAttempt(attemptId: string, requestedByUserId?: string): Promise<AssessmentAttempt | undefined> {
    const db = await this.read();
    let attempt = db.attempts[attemptId];

    // Check legacy sessions adapter fallback
    if (!attempt && db.sessions[attemptId]) {
      const { attempt: migrated } = migrateLegacySession(db.sessions[attemptId]);
      attempt = migrated;
    }

    if (!attempt) return undefined;
    if (requestedByUserId && attempt.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError(
        `Learner ${requestedByUserId} cannot access attempt belonging to ${attempt.userId}`
      );
    }
    return attempt;
  }

  async saveAttempt(attempt: AssessmentAttempt): Promise<void> {
    return this.withLock(async () => {
      const db = await this.read();
      const existing = db.attempts[attempt.attemptId];
      if (
        existing &&
        (existing.skillRubricVersion !== attempt.skillRubricVersion ||
          existing.challengeRubricVersion !== attempt.challengeRubricVersion)
      ) {
        throw new Error("Rubric versions are immutable once an AssessmentAttempt has started.");
      }
      db.attempts[attempt.attemptId] = attempt;
      await this.write(db);
    });
  }

  async listAttempts(userId?: string): Promise<AssessmentAttempt[]> {
    const db = await this.read();
    const attempts = Object.values(db.attempts);
    return userId ? attempts.filter((a) => a.userId === userId) : attempts;
  }

  // ==========================================
  // Evidence Artifact & Validation Report
  // ==========================================

  async saveEvidenceArtifact(artifact: EvidenceArtifact): Promise<EvidenceArtifact> {
    const db = await this.read();
    if (artifact.idempotencyKey) {
      const existing = Object.values(db.artifacts).find(
        (a) => a.idempotencyKey === artifact.idempotencyKey && a.attemptId === artifact.attemptId
      );
      if (existing) return existing;
    }
    db.artifacts[artifact.artifactId] = artifact;
    await this.write(db);
    return artifact;
  }

  async getEvidenceArtifact(artifactId: string, requestedByUserId?: string): Promise<EvidenceArtifact | undefined> {
    const db = await this.read();
    const artifact = db.artifacts[artifactId];
    if (!artifact) return undefined;
    if (requestedByUserId && artifact.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return artifact;
  }

  async saveValidationReport(report: ValidationReport): Promise<ValidationReport> {
    const db = await this.read();
    if (report.idempotencyKey) {
      const existing = Object.values(db.validationReports).find(
        (r) => r.idempotencyKey === report.idempotencyKey && r.attemptId === report.attemptId
      );
      if (existing) return existing;
    }
    db.validationReports[report.reportId] = report;
    await this.write(db);
    return report;
  }

  async getValidationReport(reportId: string, requestedByUserId?: string): Promise<ValidationReport | undefined> {
    const db = await this.read();
    const report = db.validationReports[reportId];
    if (!report) return undefined;
    if (requestedByUserId && report.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return report;
  }

  // ==========================================
  // Viva Session
  // ==========================================

  async saveVivaSession(viva: VivaSession): Promise<void> {
    const db = await this.read();
    db.vivaSessions[viva.sessionId] = viva;
    await this.write(db);
  }

  async getVivaSession(sessionId: string, requestedByUserId?: string): Promise<VivaSession | undefined> {
    const db = await this.read();
    let viva = db.vivaSessions[sessionId];

    if (!viva && db.sessions[sessionId]) {
      const { vivaSession: migrated } = migrateLegacySession(db.sessions[sessionId]);
      viva = migrated;
    }

    if (!viva) return undefined;
    if (requestedByUserId && viva.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return viva;
  }

  // ==========================================
  // Assessment Result & Credential V2
  // ==========================================

  async saveAssessmentResult(result: AssessmentResult): Promise<AssessmentResult> {
    const db = await this.read();
    if (result.idempotencyKey) {
      const existing = Object.values(db.assessmentResults).find(
        (r) => r.idempotencyKey === result.idempotencyKey && r.attemptId === result.attemptId
      );
      if (existing) return existing;
    }
    db.assessmentResults[result.resultId] = result;
    await this.write(db);
    return result;
  }

  async getAssessmentResult(resultId: string, requestedByUserId?: string): Promise<AssessmentResult | undefined> {
    const db = await this.read();
    let result = db.assessmentResults[resultId];

    // Check legacy credentials
    if (!result && db.credentials[resultId.replace(/^res_/, "")]) {
      const { result: migrated } = migrateLegacyCredential(db.credentials[resultId.replace(/^res_/, "")]);
      result = migrated;
    }

    if (!result) return undefined;
    if (requestedByUserId && result.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return result;
  }

  async saveCredentialV2(credential: Credential): Promise<Credential> {
    const db = await this.read();
    if (credential.idempotencyKey) {
      const existing = Object.values(db.credentialsV2).find(
        (c) => c.idempotencyKey === credential.idempotencyKey && c.attemptId === credential.attemptId
      );
      if (existing) return existing;
    }
    db.credentialsV2[credential.credentialId] = credential;
    await this.write(db);
    return credential;
  }

  async getCredentialV2(credentialId: string, requestedByUserId?: string): Promise<Credential | undefined> {
    const db = await this.read();
    let cred = db.credentialsV2[credentialId];

    if (!cred && db.credentials[credentialId]) {
      const { credential: migrated } = migrateLegacyCredential(db.credentials[credentialId]);
      cred = migrated;
    }

    if (!cred) return undefined;
    if (requestedByUserId && cred.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return cred;
  }

  // ==========================================
  // Public Passport Projection (Zero Raw Evidence Exposed)
  // ==========================================

  async getPublicPassport(credentialId: string): Promise<PublicPassportProjection | undefined> {
    const db = await this.read();
    let cred = db.credentialsV2[credentialId];
    let result: AssessmentResult | undefined;

    if (!cred && db.credentials[credentialId]) {
      const legacy = db.credentials[credentialId];
      const migrated = migrateLegacyCredential(legacy);
      cred = migrated.credential;
      result = migrated.result;
    } else if (cred) {
      result = db.assessmentResults[cred.resultId];
    }

    if (!cred || !result) return undefined;

    const user = db.learners[cred.userId];
    const consent = db.consents[cred.userId];
    const attempt = db.attempts[cred.attemptId];
    const challenge = attempt ? db.challenges[attempt.challengeId] : undefined;
    const role = challenge ? db.roles[challenge.roleId] : undefined;

    return {
      passportId: cred.credentialId,
      publicHandle: user?.publicHandle ?? "verified_learner",
      displayName: consent?.publicSharingConsent ? user?.displayName : undefined,
      roleTitle: role?.title ?? "Entry-Level Data Entry Operator",
      challengeTitle: challenge?.title ?? "Retail Sales Cleanup & Reporting",
      compositeScore: result.composite,
      dimensions: {
        practicalExecution: result.dimensions.P,
        conceptualUnderstanding: result.dimensions.U,
        evidenceConsistency: result.dimensions.C
      },
      outcome: result.outcome,
      evidenceHash: cred.evidenceHash,
      issuedAt: cred.issuedAt,
      rubricBasis: "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot.",
      verificationBadge: "Record matches our database",
      jwsSignature: cred.jwsSignature,
      status: cred.status
    };
  }

  // ==========================================
  // Opportunity & Learning Resources
  // ==========================================

  async saveOpportunity(opportunity: Opportunity): Promise<void> {
    const db = await this.read();
    db.opportunities[opportunity.opportunityId] = opportunity;
    await this.write(db);
  }

  async listOpportunities(options?: { activeOnly?: boolean }): Promise<Opportunity[]> {
    const all = Object.values((await this.read()).opportunities);
    return options?.activeOnly ? all.filter((o) => o.listingStatus === "active") : all;
  }

  async saveLearningResource(resource: LearningResource): Promise<void> {
    const db = await this.read();
    db.learningResources[resource.resourceId] = resource;
    await this.write(db);
  }

  async listLearningResources(roleId?: string): Promise<LearningResource[]> {
    const all = Object.values((await this.read()).learningResources);
    return roleId ? all.filter((r) => !r.roleId || r.roleId === roleId) : all;
  }

  // ==========================================
  // Audit Events
  // ==========================================

  async recordAuditEvent(event: AuditEvent): Promise<void> {
    return this.withLock(async () => {
      const db = await this.read();
      db.auditEvents.push(event);
      await this.write(db);
    });
  }

  async listAuditEvents(entityId?: string): Promise<AuditEvent[]> {
    const all = (await this.read()).auditEvents;
    return entityId ? all.filter((e) => e.entityId === entityId) : all;
  }

  // ==========================================
  // Low-level Read & Write
  // ==========================================

  private async read(): Promise<LocalDatabase> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
      return {
        sessions: parsed.sessions ?? {},
        credentials: parsed.credentials ?? {},
        learners: parsed.learners ?? {},
        consents: parsed.consents ?? {},
        roles: parsed.roles ?? {},
        challenges: parsed.challenges ?? {},
        attempts: parsed.attempts ?? {},
        artifacts: parsed.artifacts ?? {},
        validationReports: parsed.validationReports ?? {},
        vivaSessions: parsed.vivaSessions ?? {},
        assessmentResults: parsed.assessmentResults ?? {},
        credentialsV2: parsed.credentialsV2 ?? {},
        opportunities: parsed.opportunities ?? {},
        learningResources: parsed.learningResources ?? {},
        auditEvents: parsed.auditEvents ?? []
      };
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyDatabase();
      throw error;
    }
  }

  private async write(database: LocalDatabase): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  }
}
