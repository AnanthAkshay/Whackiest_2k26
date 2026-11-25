import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
  type KeyObject
} from "node:crypto";
import { config } from "../config";

export interface Ed25519KeyPair {
  kid: string;
  isMockDevKey: boolean;
  privateKey: KeyObject;
  publicKey: KeyObject;
  publicJwk: {
    kty: "OKP";
    crv: "Ed25519";
    kid: string;
    use: "sig";
    alg: "EdDSA";
    x: string;
    isMockDevKey?: boolean;
  };
}

let cachedDevKeyPair: Ed25519KeyPair | undefined;

function toPublicJwk(publicKey: KeyObject, kid: string, isMockDevKey: boolean): Ed25519KeyPair["publicJwk"] {
  const exported = publicKey.export({ format: "jwk" }) as { x: string };
  return {
    kty: "OKP",
    crv: "Ed25519",
    kid,
    use: "sig",
    alg: "EdDSA",
    x: exported.x,
    ...(isMockDevKey ? { isMockDevKey: true } : {})
  };
}

export function getActiveSigningKeyPair(): Ed25519KeyPair {
  if (config.ed25519PrivateKeyPem && config.ed25519PublicKeyPem && config.ed25519KeyId) {
    const privateKey = createPrivateKey(config.ed25519PrivateKeyPem);
    const publicKey = createPublicKey(config.ed25519PublicKeyPem);
    return {
      kid: config.ed25519KeyId,
      isMockDevKey: false,
      privateKey,
      publicKey,
      publicJwk: toPublicJwk(publicKey, config.ed25519KeyId, false)
    };
  }

  if (!config.mockMode) {
    throw new Error("Missing ED25519_PRIVATE_KEY_PEM / ED25519_PUBLIC_KEY_PEM / ED25519_KEY_ID in production mode.");
  }

  if (!cachedDevKeyPair) {
    const kid = "dev-mock-ed25519-v1";
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    cachedDevKeyPair = {
      kid,
      isMockDevKey: true,
      privateKey,
      publicKey,
      publicJwk: toPublicJwk(publicKey, kid, true)
    };
  }

  return cachedDevKeyPair;
}

export function getPublicJwks(): { keys: Array<Ed25519KeyPair["publicJwk"]> } {
  const active = getActiveSigningKeyPair();
  return { keys: [active.publicJwk] };
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/**
 * Signs a JSON payload using Ed25519 (EdDSA) returning a compact JWS: header.payload.signature
 */
export function signEd25519Jws(
  payload: Record<string, unknown>,
  keyPair: Ed25519KeyPair = getActiveSigningKeyPair()
): string {
  const header = {
    alg: "EdDSA",
    typ: "JWT",
    kid: keyPair.kid
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = cryptoSign(null, Buffer.from(signingInput, "utf8"), keyPair.privateKey);
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export interface JwsVerifyResult {
  valid: boolean;
  reason?: string;
  header?: { alg?: string; kid?: string };
  payload?: Record<string, unknown>;
}

/**
 * Verifies a compact Ed25519 JWS against the active JWKS / public key store.
 */
export function verifyEd25519Jws(
  jwsCompact: string,
  expectedIssuer?: string,
  jwks: { keys: Array<Ed25519KeyPair["publicJwk"]> } = getPublicJwks()
): JwsVerifyResult {
  const parts = jwsCompact.split(".");
  if (parts.length !== 3) {
    return { valid: false, reason: "Malformed JWS compact serialization." };
  }

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8")) as { alg?: string; kid?: string };
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as Record<string, unknown>;
  } catch {
    return { valid: false, reason: "Malformed JWS header or payload JSON." };
  }

  if (header.alg !== "EdDSA" || !header.kid) {
    return { valid: false, reason: "Unsupported JWS algorithm or missing key ID (kid).", header, payload };
  }

  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    return { valid: false, reason: `Unknown verification key ID '${header.kid}'.`, header, payload };
  }

  if (expectedIssuer && payload.iss !== expectedIssuer) {
    return { valid: false, reason: `Issuer mismatch: expected '${expectedIssuer}'.`, header, payload };
  }

  try {
    const publicKey = createPublicKey({ key: jwk, format: "jwk" });
    const signingInput = Buffer.from(`${encodedHeader}.${encodedPayload}`, "utf8");
    const signature = base64UrlDecode(encodedSig);
    const verified = cryptoVerify(null, signingInput, publicKey, signature);
    if (!verified) {
      return { valid: false, reason: "Ed25519 signature verification failed.", header, payload };
    }
    return { valid: true, header, payload };
  } catch {
    return { valid: false, reason: "Cryptographic verification error.", header, payload };
  }
}
