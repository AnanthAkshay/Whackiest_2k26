import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";
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
import { type Store, UnauthorizedAccessError } from "./Store";

export interface DynamoStoreOptions {
  endpoint?: string;
}

export class DynamoStore implements Store {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly sessionsTable: string,
    private readonly credentialsTable: string,
    region: string,
    options: DynamoStoreOptions = {}
  ) {
    const baseClient = new DynamoDBClient({
      region,
      ...(options.endpoint ? { endpoint: options.endpoint } : {})
    });
    this.client = DynamoDBDocumentClient.from(baseClient, {
      marshallOptions: { removeUndefinedValues: true }
    });
  }

  // ==========================================
  // Legacy Session & Credential methods
  // ==========================================

  async createSession(session: Session): Promise<void> {
    await this.putSession(session);
  }

  async getSession(id: string): Promise<Session | undefined> {
    const response = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: id } })
    );
    return response.Item?.record as Session | undefined;
  }

  async saveSession(session: Session): Promise<void> {
    await this.putSession(session);
  }

  async deleteSession(id: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({ TableName: this.sessionsTable, Key: { sessionId: id } })
    );
  }

  async listSessions(): Promise<Session[]> {
    const items: Session[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const response = await this.client.send(
        new ScanCommand({
          TableName: this.sessionsTable,
          ExclusiveStartKey: lastKey
        })
      );
      for (const item of response.Items ?? []) {
        if (item.record && !item.sessionId?.includes("#")) {
          items.push(item.record as Session);
        }
      }
      lastKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);
    return items;
  }

  async saveCredential(record: SkillRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.credentialsTable,
        Item: { pageId: record.id, sessionId: record.sessionId, record }
      })
    );
  }

  async getCredential(pageId: string): Promise<SkillRecord | undefined> {
    const response = await this.client.send(
      new GetCommand({ TableName: this.credentialsTable, Key: { pageId } })
    );
    return response.Item?.record as SkillRecord | undefined;
  }

  async deleteCredential(pageId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({ TableName: this.credentialsTable, Key: { pageId } })
    );
  }

  async getCredentialBySessionId(sessionId: string): Promise<SkillRecord | undefined> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.credentialsTable,
        IndexName: "sessionId-index",
        KeyConditionExpression: "sessionId = :sid",
        ExpressionAttributeValues: { ":sid": sessionId },
        Limit: 1
      })
    );
    const item = response.Items?.[0];
    return item?.record as SkillRecord | undefined;
  }

  // ==========================================
  // Learner Profile & Consent
  // ==========================================

  async saveLearnerProfile(profile: LearnerProfile): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `LEARNER#${profile.userId}`, record: profile }
      })
    );
  }

  async getLearnerProfile(userId: string): Promise<LearnerProfile | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `LEARNER#${userId}` } })
    );
    return res.Item?.record as LearnerProfile | undefined;
  }

  async saveConsent(consent: ConsentRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `CONSENT#${consent.userId}`, record: consent }
      })
    );
  }

  async getConsent(userId: string): Promise<ConsentRecord | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `CONSENT#${userId}` } })
    );
    return res.Item?.record as ConsentRecord | undefined;
  }

  // ==========================================
  // Role & Challenge Catalogue
  // ==========================================

  async saveRole(role: Role): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `ROLE#${role.roleId}`, record: role }
      })
    );
  }

  async getRole(roleId: string): Promise<Role | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `ROLE#${roleId}` } })
    );
    return res.Item?.record as Role | undefined;
  }

  async listRoles(): Promise<Role[]> {
    const items: Role[] = [];
    const res = await this.client.send(new ScanCommand({ TableName: this.sessionsTable }));
    for (const item of res.Items ?? []) {
      if (item.sessionId?.startsWith("ROLE#") && item.record) {
        items.push(item.record as Role);
      }
    }
    return items;
  }

  async saveChallenge(challenge: Challenge): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `CHALLENGE#${challenge.challengeId}`, record: challenge }
      })
    );
  }

  async getChallenge(challengeId: string): Promise<Challenge | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `CHALLENGE#${challengeId}` } })
    );
    return res.Item?.record as Challenge | undefined;
  }

  async listChallenges(roleId?: string): Promise<Challenge[]> {
    const items: Challenge[] = [];
    const res = await this.client.send(new ScanCommand({ TableName: this.sessionsTable }));
    for (const item of res.Items ?? []) {
      if (item.sessionId?.startsWith("CHALLENGE#") && item.record) {
        const c = item.record as Challenge;
        if (!roleId || c.roleId === roleId) items.push(c);
      }
    }
    return items;
  }

  // ==========================================
  // Assessment Attempt
  // ==========================================

  async createAttempt(attempt: AssessmentAttempt): Promise<AssessmentAttempt> {
    if (attempt.idempotencyKey) {
      const existingAttempts = await this.listAttempts(attempt.userId);
      const existing = existingAttempts.find((a) => a.idempotencyKey === attempt.idempotencyKey);
      if (existing) return existing;
    }
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `ATTEMPT#${attempt.attemptId}`, record: attempt }
      })
    );
    return attempt;
  }

  async getAttempt(attemptId: string, requestedByUserId?: string): Promise<AssessmentAttempt | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `ATTEMPT#${attemptId}` } })
    );
    const attempt = res.Item?.record as AssessmentAttempt | undefined;
    if (!attempt) return undefined;
    if (requestedByUserId && attempt.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return attempt;
  }

  async saveAttempt(attempt: AssessmentAttempt): Promise<void> {
    const existing = await this.getAttempt(attempt.attemptId);
    if (
      existing &&
      (existing.skillRubricVersion !== attempt.skillRubricVersion ||
        existing.challengeRubricVersion !== attempt.challengeRubricVersion)
    ) {
      throw new Error("Rubric versions are immutable once an AssessmentAttempt has started.");
    }
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `ATTEMPT#${attempt.attemptId}`, record: attempt }
      })
    );
  }

  async listAttempts(userId?: string): Promise<AssessmentAttempt[]> {
    const items: AssessmentAttempt[] = [];
    const res = await this.client.send(new ScanCommand({ TableName: this.sessionsTable }));
    for (const item of res.Items ?? []) {
      if (item.sessionId?.startsWith("ATTEMPT#") && item.record) {
        const a = item.record as AssessmentAttempt;
        if (!userId || a.userId === userId) items.push(a);
      }
    }
    return items;
  }

  // ==========================================
  // Evidence Artifact & Validation Report
  // ==========================================

  async saveEvidenceArtifact(artifact: EvidenceArtifact): Promise<EvidenceArtifact> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `ARTIFACT#${artifact.artifactId}`, record: artifact }
      })
    );
    return artifact;
  }

  async getEvidenceArtifact(artifactId: string, requestedByUserId?: string): Promise<EvidenceArtifact | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `ARTIFACT#${artifactId}` } })
    );
    const artifact = res.Item?.record as EvidenceArtifact | undefined;
    if (!artifact) return undefined;
    if (requestedByUserId && artifact.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return artifact;
  }

  async saveValidationReport(report: ValidationReport): Promise<ValidationReport> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `REPORT#${report.reportId}`, record: report }
      })
    );
    return report;
  }

  async getValidationReport(reportId: string, requestedByUserId?: string): Promise<ValidationReport | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `REPORT#${reportId}` } })
    );
    const report = res.Item?.record as ValidationReport | undefined;
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
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `VIVA#${viva.sessionId}`, record: viva }
      })
    );
  }

  async getVivaSession(sessionId: string, requestedByUserId?: string): Promise<VivaSession | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `VIVA#${sessionId}` } })
    );
    const viva = res.Item?.record as VivaSession | undefined;
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
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `RESULT#${result.resultId}`, record: result }
      })
    );
    return result;
  }

  async getAssessmentResult(resultId: string, requestedByUserId?: string): Promise<AssessmentResult | undefined> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: `RESULT#${resultId}` } })
    );
    const result = res.Item?.record as AssessmentResult | undefined;
    if (!result) return undefined;
    if (requestedByUserId && result.userId !== requestedByUserId) {
      throw new UnauthorizedAccessError();
    }
    return result;
  }

  async saveCredentialV2(credential: Credential): Promise<Credential> {
    await this.client.send(
      new PutCommand({
        TableName: this.credentialsTable,
        Item: {
          pageId: `CREDV2#${credential.credentialId}`,
          sessionId: credential.attemptId,
          record: credential
        }
      })
    );
    return credential;
  }

  async getCredentialV2(credentialId: string, requestedByUserId?: string): Promise<Credential | undefined> {
    const res = await this.client.send(
      new GetCommand({
        TableName: this.credentialsTable,
        Key: { pageId: `CREDV2#${credentialId}` }
      })
    );
    const cred = res.Item?.record as Credential | undefined;
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
    const cred = await this.getCredentialV2(credentialId);
    if (!cred) return undefined;
    const result = await this.getAssessmentResult(cred.resultId);
    if (!result) return undefined;
    const user = await this.getLearnerProfile(cred.userId);
    const consent = await this.getConsent(cred.userId);
    const attempt = await this.getAttempt(cred.attemptId);
    const challenge = attempt ? await this.getChallenge(attempt.challengeId) : undefined;
    const role = challenge ? await this.getRole(challenge.roleId) : undefined;

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
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `OPP#${opportunity.opportunityId}`, record: opportunity }
      })
    );
  }

  async listOpportunities(options?: { activeOnly?: boolean }): Promise<Opportunity[]> {
    const items: Opportunity[] = [];
    const res = await this.client.send(new ScanCommand({ TableName: this.sessionsTable }));
    for (const item of res.Items ?? []) {
      if (item.sessionId?.startsWith("OPP#") && item.record) {
        const o = item.record as Opportunity;
        if (!options?.activeOnly || o.listingStatus === "active") items.push(o);
      }
    }
    return items;
  }

  async saveLearningResource(resource: LearningResource): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `RES#${resource.resourceId}`, record: resource }
      })
    );
  }

  async listLearningResources(roleId?: string): Promise<LearningResource[]> {
    const items: LearningResource[] = [];
    const res = await this.client.send(new ScanCommand({ TableName: this.sessionsTable }));
    for (const item of res.Items ?? []) {
      if (item.sessionId?.startsWith("RES#") && item.record) {
        const r = item.record as LearningResource;
        if (!roleId || !r.roleId || r.roleId === roleId) items.push(r);
      }
    }
    return items;
  }

  // ==========================================
  // Audit Events
  // ==========================================

  async recordAuditEvent(event: AuditEvent): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: `AUDIT#${event.eventId}`, record: event }
      })
    );
  }

  async listAuditEvents(entityId?: string): Promise<AuditEvent[]> {
    const items: AuditEvent[] = [];
    const res = await this.client.send(new ScanCommand({ TableName: this.sessionsTable }));
    for (const item of res.Items ?? []) {
      if (item.sessionId?.startsWith("AUDIT#") && item.record) {
        const a = item.record as AuditEvent;
        if (!entityId || a.entityId === entityId) items.push(a);
      }
    }
    return items;
  }

  private async putSession(session: Session): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: session.id, record: session }
      })
    );
  }
}
