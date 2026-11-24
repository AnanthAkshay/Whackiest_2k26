/**
 * Pricing constants for cost tracking.
 * All prices are in INR. Edit USD_INR when the exchange rate changes.
 */

/** Exchange rate: 1 USD = this many INR. */
export const USD_INR = 84.0;

// ─── ElevenLabs Conversational AI (Scale plan) ───
/** ElevenLabs charge per conversation-second in USD. */
export const ELEVENLABS_PER_SECOND_USD = 0.08 / 60; // ~$0.08/min
/** ElevenLabs charge per conversation-second in INR. */
export const ELEVENLABS_PER_SECOND_INR = ELEVENLABS_PER_SECOND_USD * USD_INR;

// ─── AWS Bedrock – Claude 3.5 Sonnet v2 (cross-region) ───
/** Bedrock input token price in USD. */
export const BEDROCK_INPUT_PER_TOKEN_USD = 3.0 / 1_000_000; // $3/MTok
/** Bedrock output token price in USD. */
export const BEDROCK_OUTPUT_PER_TOKEN_USD = 15.0 / 1_000_000; // $15/MTok
/** Bedrock input token price in INR. */
export const BEDROCK_INPUT_PER_TOKEN_INR = BEDROCK_INPUT_PER_TOKEN_USD * USD_INR;
/** Bedrock output token price in INR. */
export const BEDROCK_OUTPUT_PER_TOKEN_INR = BEDROCK_OUTPUT_PER_TOKEN_USD * USD_INR;

// ─── Rough cost-per-second estimate (for the cap calculation) ───
// Assumes: ~2 Bedrock evaluator calls per minute (~600 input + 400 output tokens each),
// plus continuous ElevenLabs conversation.
const EVALUATOR_CALLS_PER_SECOND = 2 / 60;
const AVG_INPUT_TOKENS_PER_CALL = 600;
const AVG_OUTPUT_TOKENS_PER_CALL = 400;
const BEDROCK_PER_SECOND_INR =
  EVALUATOR_CALLS_PER_SECOND *
  (AVG_INPUT_TOKENS_PER_CALL * BEDROCK_INPUT_PER_TOKEN_INR +
   AVG_OUTPUT_TOKENS_PER_CALL * BEDROCK_OUTPUT_PER_TOKEN_INR);

/** Estimated all-in cost per active session-second in INR. */
export const ESTIMATED_COST_PER_SECOND_INR = ELEVENLABS_PER_SECOND_INR + BEDROCK_PER_SECOND_INR;

/** Compute the total estimated cost from a cost tracker snapshot. */
export interface CostTracker {
  elevenLabsSeconds: number;
  bedrockInputTokens: number;
  bedrockOutputTokens: number;
  estimatedCostInr: number;
}

export function estimateCostInr(tracker: Omit<CostTracker, "estimatedCostInr">): number {
  const el = tracker.elevenLabsSeconds * ELEVENLABS_PER_SECOND_INR;
  const br =
    tracker.bedrockInputTokens * BEDROCK_INPUT_PER_TOKEN_INR +
    tracker.bedrockOutputTokens * BEDROCK_OUTPUT_PER_TOKEN_INR;
  return Math.round((el + br) * 10000) / 10000; // 4 decimal places
}
