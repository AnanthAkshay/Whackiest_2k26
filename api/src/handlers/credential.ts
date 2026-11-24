import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { config } from "../config";
import { logError, logInfo } from "../logger";
import { loadSkillRubric } from "../rubric";
import { computeSeal } from "../services/seal";
import { generateSkillPageHtml } from "../services/skillPageHtml";
import { getStore } from "../store/createStore";
import type { HttpEvent, HttpResponse, SkillRecord } from "../types";

const createSchema = z.object({ name: z.string().trim().max(80).optional() });

// ─── helpers ───

function getWebPublicDirectory(): string {
  const localWeb = resolve(process.cwd(), "web", "public");
  if (existsSync(localWeb)) return localWeb;
  return resolve(process.cwd(), "..", "web", "public");
}

async function writePageFile(pageId: string, html: string): Promise<void> {
  if (config.mockMode) {
    const webPublic = getWebPublicDirectory();
    const pagesDirectory = resolve(webPublic, "pages", pageId);
    const pDirectory = resolve(webPublic, "p", pageId);
    await Promise.all([
      mkdir(pagesDirectory, { recursive: true }).then(() => writeFile(resolve(pagesDirectory, "index.html"), html, "utf8")),
      mkdir(pDirectory, { recursive: true }).then(() => writeFile(resolve(pDirectory, "index.html"), html, "utf8"))
    ]);
    return;
  }
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: config.awsRegion });
  await Promise.all([
    client.send(new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: `pages/${pageId}/index.html`,
      Body: html,
      ContentType: "text/html; charset=utf-8"
    })),
    client.send(new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: `p/${pageId}`,
      Body: html,
      ContentType: "text/html; charset=utf-8"
    })),
    client.send(new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: `p/${pageId}/index.html`,
      Body: html,
      ContentType: "text/html; charset=utf-8"
    }))
  ]);
}

async function deletePageFile(pageId: string): Promise<void> {
  if (config.mockMode) {
    const webPublic = getWebPublicDirectory();
    const pagesDirectory = resolve(webPublic, "pages", pageId);
    const pDirectory = resolve(webPublic, "p", pageId);
    await Promise.all([
      rm(pagesDirectory, { recursive: true, force: true }),
      rm(pDirectory, { recursive: true, force: true })
    ]);
    return;
  }
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: config.awsRegion });
  await Promise.all([
    client.send(new DeleteObjectCommand({
      Bucket: config.s3Bucket,
      Key: `pages/${pageId}/index.html`
    })),
    client.send(new DeleteObjectCommand({
      Bucket: config.s3Bucket,
      Key: `p/${pageId}`
    })),
    client.send(new DeleteObjectCommand({
      Bucket: config.s3Bucket,
      Key: `p/${pageId}/index.html`
    }))
  ]);
}

function apiBase(): string {
  if (config.mockMode) return `http://localhost:${config.port}`;
  return config.corsOrigin;
}

// ─── POST /api/session/:id/credential ───

export async function createCredentialHandler(
  event: HttpEvent<unknown>
): Promise<HttpResponse<{ pageId: string } | { error: string }>> {
  const sessionId = event.pathParameters?.id;
  if (!sessionId) return { statusCode: 404, body: { error: "Session was not found." } };

  const session = await getStore().getSession(sessionId);
  if (!session) return { statusCode: 404, body: { error: "Session was not found." } };
  if (session.status !== "complete") return { statusCode: 400, body: { error: "Session must be finished before creating a Skill Page." } };

  // idempotent: if already created, return existing
  if (session.pageId) {
    return { statusCode: 200, body: { pageId: session.pageId } };
  }

  // load the finish-record (stored with id = session.recordId)
  const finishRecord = session.recordId ? await getStore().getCredential(session.recordId) : undefined;
  if (!finishRecord) return { statusCode: 400, body: { error: "Session has no finish record." } };
  if (finishRecord.tooShort) return { statusCode: 400, body: { error: "Session was too short to create a Skill Page." } };

  const parsed = createSchema.safeParse(event.body ?? {});
  const name = parsed.success ? (parsed.data.name || "Anonymous candidate") : "Anonymous candidate";

  const rubric = await loadSkillRubric(session.skill);

  const pageId = randomBytes(12).toString("base64url"); // 16 chars
  const credential: SkillRecord = {
    ...finishRecord,
    id: pageId,
    name,
    shared: false,
    basisNote: rubric.basisNote,
    seal: ""
  };
  credential.seal = computeSeal(credential);

  await getStore().saveCredential(credential);
  await getStore().saveSession({ ...session, pageId });

  const html = generateSkillPageHtml(credential, apiBase());
  try {
    await writePageFile(pageId, html);
  } catch (error) {
    logError("credential.write_page_failed", error, { pageId });
  }

  logInfo("credential.created", { sessionId, pageId });
  return { statusCode: 201, body: { pageId } };
}

// ─── GET /api/credential/:pageId ───

export async function getCredentialHandler(
  event: HttpEvent
): Promise<HttpResponse<SkillRecord | { error: string }>> {
  const pageId = event.pathParameters?.pageId;
  if (!pageId) return { statusCode: 404, body: { error: "Credential was not found." } };

  const record = await getStore().getCredential(pageId);
  if (!record) return { statusCode: 404, body: { error: "Credential was not found." } };

  // strip seal from response
  const { seal: _seal, ...safe } = record;
  return { statusCode: 200, body: safe as SkillRecord };
}

// ─── PATCH /api/credential/:pageId/share ───

export async function shareCredentialHandler(
  event: HttpEvent
): Promise<HttpResponse<{ shared: boolean } | { error: string }>> {
  const pageId = event.pathParameters?.pageId;
  if (!pageId) return { statusCode: 404, body: { error: "Credential was not found." } };

  const record = await getStore().getCredential(pageId);
  if (!record) return { statusCode: 404, body: { error: "Credential was not found." } };

  record.shared = true;
  await getStore().saveCredential(record);

  logInfo("credential.shared", { pageId });
  return { statusCode: 200, body: { shared: true } };
}

// ─── DELETE /api/credential/:pageId ───

export async function deleteCredentialHandler(
  event: HttpEvent
): Promise<HttpResponse<{ deleted: boolean } | { error: string }>> {
  const pageId = event.pathParameters?.pageId;
  if (!pageId) return { statusCode: 404, body: { error: "Credential was not found." } };

  const record = await getStore().getCredential(pageId);
  if (!record) return { statusCode: 404, body: { error: "Credential was not found." } };

  // delete the page file, then credential, then session data
  try {
    await deletePageFile(pageId);
  } catch (error) {
    logError("credential.delete_page_failed", error, { pageId });
  }

  await getStore().deleteCredential(pageId);

  if (record.sessionId) {
    await getStore().deleteSession(record.sessionId);
  }

  logInfo("credential.deleted", { pageId });
  return { statusCode: 200, body: { deleted: true } };
}
