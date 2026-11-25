const REDACTED_KEYS = new Set([
  "apiKey",
  "elevenLabsApiKey",
  "pageSecret",
  "adminKey",
  "privateKey",
  "ed25519PrivateKeyPem",
  "password",
  "token",
  "email",
  "phone",
  "displayName"
]);

function sanitizeLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (REDACTED_KEYS.has(key)) {
      safe[key] = "[REDACTED]";
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

export function logInfo(event: string, fields: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ level: "info", event, ...sanitizeLogFields(fields) }));
}

export function logError(event: string, error: unknown, fields: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(JSON.stringify({ level: "error", event, message, ...sanitizeLogFields(fields) }));
}

export interface ProviderTelemetry {
  provider: "elevenlabs" | "bedrock" | "python-validator" | "s3" | "dynamodb" | "mock";
  status: "ok" | "mock" | "degraded" | "failed";
  requestId: string;
  latencyMs: number;
  retries?: number;
  failureCategory?: "timeout" | "auth" | "network" | "validation" | "rate_limit" | "unknown";
}

export function logProviderEvent(
  event: string,
  telemetry: ProviderTelemetry,
  extra: Record<string, unknown> = {}
): void {
  logInfo(event, {
    ...telemetry,
    ...sanitizeLogFields(extra)
  });
}
