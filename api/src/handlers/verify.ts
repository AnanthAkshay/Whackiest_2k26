import { getPublicJwks } from "../services/passportCrypto";
import { verifyPassportById } from "../services/passportService";
import { getStore } from "../store/createStore";
import type { HttpEvent, HttpResponse } from "../types";

export async function getJwksHandler(_event: HttpEvent): Promise<HttpResponse<unknown>> {
  return {
    statusCode: 200,
    body: getPublicJwks()
  };
}

export async function getPublicPassportHandler(event: HttpEvent): Promise<HttpResponse<unknown>> {
  const id = event.pathParameters?.id ?? event.pathParameters?.pageId;
  if (!id) return { statusCode: 404, body: { error: "Skill Passport was not found." } };

  const store = getStore();
  const verification = await verifyPassportById(store, id);
  if (!verification.found || !verification.projection) {
    return { statusCode: 404, body: { error: "Skill Passport is private, withdrawn, or not found." } };
  }

  return {
    statusCode: 200,
    body: {
      passport: verification.projection,
      verification: {
        valid: verification.valid,
        verificationType: verification.verificationType,
        status: verification.status,
        issuer: verification.issuer,
        keyId: verification.keyId,
        evidenceHash: verification.evidenceHash,
        isMockDevKey: verification.isMockDevKey,
        meaningDisclaimer: verification.meaningDisclaimer
      }
    }
  };
}

export async function verifyCredentialHandler(event: HttpEvent): Promise<HttpResponse<unknown>> {
  const pageId = event.pathParameters?.pageId ?? event.pathParameters?.credentialId;
  if (!pageId) return { statusCode: 404, body: { error: "Record was not found." } };

  const store = getStore();
  const result = await verifyPassportById(store, pageId);
  if (!result.found) {
    return { statusCode: 404, body: { error: "Record was not found." } };
  }

  // Legacy HMAC response preserves `record` without `seal` for existing Skill Pages
  if (result.verificationType === "legacy-hmac-record-integrity") {
    const legacy = await store.getCredential(pageId);
    if (!legacy) return { statusCode: 404, body: { error: "Record was not found." } };
    const { seal: _seal, ...safe } = legacy;
    return {
      statusCode: 200,
      body: {
        valid: result.valid,
        verificationType: result.verificationType,
        legacyLabel: result.legacyLabel,
        meaningDisclaimer: result.meaningDisclaimer,
        record: safe
      }
    };
  }

  return {
    statusCode: 200,
    body: {
      valid: result.valid,
      verificationType: result.verificationType,
      status: result.status,
      issuer: result.issuer,
      keyId: result.keyId,
      evidenceHash: result.evidenceHash,
      reason: result.reason,
      isMockDevKey: result.isMockDevKey,
      meaningDisclaimer: result.meaningDisclaimer,
      passport: result.projection
    }
  };
}
