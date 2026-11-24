export function logInfo(event: string, fields: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ level: "info", event, ...fields }));
}

export function logError(event: string, error: unknown, fields: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(JSON.stringify({ level: "error", event, message, ...fields }));
}
