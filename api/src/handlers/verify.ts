import { computeSeal } from "../services/seal";
import { getStore } from "../store/createStore";
import type { HttpEvent, HttpResponse, SkillRecord } from "../types";

type VerifyResponse = { valid: boolean; record: Omit<SkillRecord, "seal"> } | { error: string };

export async function verifyCredentialHandler(event: HttpEvent): Promise<HttpResponse<VerifyResponse>> {
  const pageId = event.pathParameters?.pageId;
  if (!pageId) return { statusCode: 404, body: { error: "Record was not found." } };

  const record = await getStore().getCredential(pageId);
  if (!record) return { statusCode: 404, body: { error: "Record was not found." } };

  // unshared pages return 404 publicly
  if (!record.shared) return { statusCode: 404, body: { error: "Record was not found." } };

  const expected = computeSeal(record);
  const valid = expected === record.seal;

  const { seal: _seal, ...safe } = record;
  return { statusCode: 200, body: { valid, record: safe } };
}
