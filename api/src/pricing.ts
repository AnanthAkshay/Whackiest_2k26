/**
 * Pricing constants for cost estimation.
 * All prices are configurable estimates in INR; never treat as guaranteed billing figures.
 */

export const USD_INR = Number(process.env.USD_INR ?? 84.0);

// ─── ElevenLabs Conversational AI (Estimate) ───
export const ELEVENLABS_PER_SECOND_USD = Number(process.env.ELEVENLABS_PER_SECOND_USD ?? 0.08 / 60);
export const ELEVENLABS_PER_SECOND_INR = ELEVENLABS_PER_SECOND_USD * USD_INR;

// ─── AWS Bedrock – Claude 3.5 Sonnet (Estimate) ───
export const BEDROCK_INPUT_PER_TOKEN_USD = Number(process.env.BEDROCK_INPUT_PER_TOKEN_USD ?? 3.0 / 1_000_000);
export const BEDROCK_OUTPUT_PER_TOKEN_USD = Number(process.env.BEDROCK_OUTPUT_PER_TOKEN_USD ?? 15.0 / 1_000_000);
export const BEDROCK_INPUT_PER_TOKEN_INR = BEDROCK_INPUT_PER_TOKEN_USD * USD_INR;
export const BEDROCK_OUTPUT_PER_TOKEN_INR = BEDROCK_OUTPUT_PER_TOKEN_USD * USD_INR;

// ─── Storage & Compute Estimates (S3 / Lambda) ───
export const STORAGE_PER_MB_MONTH_INR = Number(process.env.STORAGE_PER_MB_MONTH_INR ?? 0.002);
export const COMPUTE_PER_SECOND_INR = Number(process.env.COMPUTE_PER_SECOND_INR ?? 0.0014);

const EVALUATOR_CALLS_PER_SECOND = 2 / 60;
const AVG_INPUT_TOKENS_PER_CALL = 600;
const AVG_OUTPUT_TOKENS_PER_CALL = 400;
const BEDROCK_PER_SECOND_INR =
  EVALUATOR_CALLS_PER_SECOND *
  (AVG_INPUT_TOKENS_PER_CALL * BEDROCK_INPUT_PER_TOKEN_INR +
    AVG_OUTPUT_TOKENS_PER_CALL * BEDROCK_OUTPUT_PER_TOKEN_INR);

/** Estimated all-in cost per active session-second in INR (configurable estimate). */
export const ESTIMATED_COST_PER_SECOND_INR = ELEVENLABS_PER_SECOND_INR + BEDROCK_PER_SECOND_INR;

export interface CostTracker {
  elevenLabsSeconds: number;
  bedrockInputTokens: number;
  bedrockOutputTokens: number;
  storageBytes?: number;
  computeSeconds?: number;
  estimatedCostInr: number;
  isEstimate?: boolean;
}

export function estimateCostInr(tracker: Omit<CostTracker, "estimatedCostInr" | "isEstimate">): number {
  const el = tracker.elevenLabsSeconds * ELEVENLABS_PER_SECOND_INR;
  const br =
    tracker.bedrockInputTokens * BEDROCK_INPUT_PER_TOKEN_INR +
    tracker.bedrockOutputTokens * BEDROCK_OUTPUT_PER_TOKEN_INR;
  const storageMb = (tracker.storageBytes ?? 0) / (1024 * 1024);
  const storage = storageMb * STORAGE_PER_MB_MONTH_INR;
  const compute = (tracker.computeSeconds ?? 0) * COMPUTE_PER_SECOND_INR;
  return Math.round((el + br + storage + compute) * 10000) / 10000;
}
