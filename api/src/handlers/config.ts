import { config } from "../config";
import { ESTIMATED_COST_PER_SECOND_INR } from "../pricing";
import type { HttpEvent, HttpResponse } from "../types";

export interface PublicConfig {
  mockMode: boolean;
  maxSessionDurationSeconds: number;
}

export async function getConfigHandler(_event: HttpEvent): Promise<HttpResponse<PublicConfig>> {
  const configured = config.maxSessionDurationSeconds;
  const capSeconds = config.costCapInr > 0 && ESTIMATED_COST_PER_SECOND_INR > 0
    ? Math.floor(config.costCapInr / ESTIMATED_COST_PER_SECOND_INR)
    : Infinity;
  const maxSessionDurationSeconds = Math.min(configured, capSeconds);
  return { statusCode: 200, body: { mockMode: config.mockMode, maxSessionDurationSeconds } };
}
