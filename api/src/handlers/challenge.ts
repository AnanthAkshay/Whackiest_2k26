import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { config } from "../config";
import { generateSeededChallengeDataset } from "../challenge/datasetGenerator";
import { inspectXlsxBuffer } from "../challenge/xlsxArchive";
import type { AssessmentAttempt, AuditEvent } from "../domain/types";
import { logInfo } from "../logger";
import { loadChallengeRubric, loadSkillRubric } from "../rubric";
import { getStore } from "../store/createStore";
import { UnauthorizedAccessError } from "../store/Store";
import type { HttpEvent, HttpResponse } from "../types";

const startChallengeSchema = z.object({
  userId: z.string().min(1).default("demo_learner"),
  challengeId: z.literal("retail_sales_cleanup").default("retail_sales_cleanup"),
  idempotencyKey: z.string().min(1).optional()
});

const uploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .default("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  contentBase64: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
  userId: z.string().min(1).optional()
});

function badRequest(error: string, code?: string): HttpResponse<{ error: string; code?: string }> {
  return { statusCode: 400, body: { error, ...(code ? { code } : {}) } };
}

async function storePrivateUpload(attemptId: string, artifactId: string, buffer: Buffer): Promise<string> {
  const storageKey = `private-uploads/${attemptId}/${artifactId}.xlsx`;
  if (config.mockMode) {
    const targetDir = join(config.localDataDirectory, "uploads", attemptId);
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, `${artifactId}.xlsx`), buffer);
    return storageKey;
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: config.awsRegion });
  await client.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    })
  );
  return storageKey;
}

export async function startChallengeHandler(
  event: HttpEvent<unknown>
): Promise<HttpResponse<unknown>> {
  const parsed = startChallengeSchema.safeParse(event.body ?? {});
  if (!parsed.success) {
    return badRequest("Invalid challenge start request.");
  }

  const { userId, challengeId, idempotencyKey } = parsed.data;
  const store = getStore();
  const attemptId = `att_${randomUUID().slice(0, 12)}`;
  const seedId = `seed_${attemptId.slice(4, 12)}`;
  const now = new Date().toISOString();

  const generated = generateSeededChallengeDataset(seedId, challengeId, "1.0.0");
  const [skillRubric, challengeRubric] = await Promise.all([
    loadSkillRubric("excel"),
    loadChallengeRubric(challengeId, { warn: () => {} })
  ]);

  const draftAttempt: AssessmentAttempt = {
    attemptId,
    userId,
    challengeId,
    seedId,
    skillRubricVersion: skillRubric.version,
    challengeRubricVersion: challengeRubric.version,
    status: "DRAFT",
    startedAt: now,
    updatedAt: now,
    idempotencyKey
  };

  const attempt = await store.createAttempt(draftAttempt);

  const audit: AuditEvent = {
    eventId: `evt_${randomUUID().slice(0, 10)}`,
    entityType: "attempt",
    entityId: attempt.attemptId,
    userId,
    action: "CHALLENGE_STARTED",
    details: { challengeId, seedId: attempt.seedId, status: attempt.status },
    timestamp: now
  };
  await store.recordAuditEvent(audit);

  return {
    statusCode: 200,
    body: {
      attempt,
      seedMetadata: {
        seedId: attempt.seedId,
        challengeId,
        version: "1.0.0",
        sha256: generated.seed.sha256,
        expectedSheets: ["Sales_Data", "Summary"],
        expectedColumns: ["Order ID", "Date", "Customer Name", "Category", "Amount"]
      },
      starterDownloadPath: `/api/challenge/${challengeId}/starter.xlsx?seedId=${attempt.seedId}`
    }
  };
}

export async function uploadArtifactHandler(
  event: HttpEvent<unknown>
): Promise<HttpResponse<unknown>> {
  const attemptId = event.pathParameters?.attemptId;
  if (!attemptId) {
    return badRequest("Missing attemptId in path.");
  }

  const parsed = uploadSchema.safeParse(event.body);
  if (!parsed.success) {
    return badRequest("Upload requires fileName and base64 content.");
  }

  const { fileName, mimeType, contentBase64, idempotencyKey, userId } = parsed.data;
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".xlsm")) {
    return badRequest(
      "Macro-enabled workbooks (.xlsm) are not allowed. Please save as a standard .xlsx file.",
      "MACRO_ENABLED"
    );
  }
  if (!lowerName.endsWith(".xlsx")) {
    return badRequest(
      "Unsupported file format. Please upload a valid .xlsx Excel workbook.",
      "WRONG_EXTENSION"
    );
  }

  const buffer = Buffer.from(contentBase64, "base64");
  if (buffer.length === 0) {
    return badRequest("The uploaded file is empty.", "EMPTY_FILE");
  }
  if (buffer.length > config.maxUploadBytes) {
    const maxMb = Math.round(config.maxUploadBytes / (1024 * 1024));
    return badRequest(`File exceeds the ${maxMb} MB maximum upload limit.`, "FILE_TOO_LARGE");
  }

  const store = getStore();
  const actorUserId = event.headers?.["x-user-id"] ?? userId;
  let attempt: AssessmentAttempt | undefined;
  try {
    attempt = await store.getAttempt(attemptId, actorUserId);
  } catch (err: unknown) {
    if (err instanceof UnauthorizedAccessError) {
      return { statusCode: 403, body: { error: "Forbidden: you do not own this assessment attempt.", code: "FORBIDDEN" } };
    }
    throw err;
  }
  if (!attempt) {
    return { statusCode: 404, body: { error: "Assessment attempt not found." } };
  }

  // Validate magic bytes, ZIP integrity, macro-free policy, and required sheets
  const inspection = inspectXlsxBuffer(buffer, ["Sales_Data", "Summary"]);
  if (!inspection.valid) {
    const nowErr = new Date().toISOString();
    await store.recordAuditEvent({
      eventId: `evt_${randomUUID().slice(0, 10)}`,
      entityType: "attempt",
      entityId: attemptId,
      userId: attempt.userId,
      action: "UPLOAD_REJECTED",
      details: { fileName, errorCode: inspection.errorCode, errorMessage: inspection.errorMessage },
      timestamp: nowErr
    });
    return badRequest(inspection.errorMessage ?? "Invalid .xlsx workbook.", inspection.errorCode);
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const artifactId = `art_${randomUUID().slice(0, 12)}`;
  const storageKey = await storePrivateUpload(attemptId, artifactId, buffer);
  const now = new Date().toISOString();

  const savedArtifact = await store.saveEvidenceArtifact({
    artifactId,
    attemptId,
    userId: attempt.userId,
    storageKey,
    mimeType,
    size: buffer.length,
    sha256,
    uploadTime: now,
    idempotencyKey
  });

  // Transition attempt state: DRAFT -> VALIDATING
  const updatedAttempt: AssessmentAttempt = {
    ...attempt,
    status: "VALIDATING",
    updatedAt: now
  };
  await store.saveAttempt(updatedAttempt);

  await store.recordAuditEvent({
    eventId: `evt_${randomUUID().slice(0, 10)}`,
    entityType: "artifact",
    entityId: savedArtifact.artifactId,
    userId: attempt.userId,
    action: "ARTIFACT_UPLOADED",
    details: {
      attemptId,
      sha256: savedArtifact.sha256,
      size: savedArtifact.size,
      sheets: inspection.sheetNames
    },
    timestamp: now
  });

  logInfo("challenge.artifact_uploaded", {
    attemptId,
    artifactId: savedArtifact.artifactId,
    sha256: savedArtifact.sha256
  });

  return {
    statusCode: 200,
    body: {
      artifact: {
        artifactId: savedArtifact.artifactId,
        attemptId: savedArtifact.attemptId,
        mimeType: savedArtifact.mimeType,
        size: savedArtifact.size,
        sha256: savedArtifact.sha256,
        uploadTime: savedArtifact.uploadTime
      },
      attempt: updatedAttempt,
      sheets: inspection.sheetNames
    }
  };
}
