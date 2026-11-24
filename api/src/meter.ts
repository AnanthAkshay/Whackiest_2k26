import type { CriterionState, CriterionStatus, TranscriptTurn } from "./types";

/** Points awarded per criterion status. */
const statusPoints: Record<CriterionStatus, number> = {
  not_covered: 0,
  wrong: 0,
  partial: 0.5,
  correct: 1
};

/** Numeric rank for upward-only comparisons (wrong is treated specially). */
const statusRank: Record<CriterionStatus, number> = {
  not_covered: 0,
  wrong: 0,
  partial: 1,
  correct: 2
};

/** Maximum single-update drop in displayed meter value. */
const MAX_DROP = 10;

/** Penalty multiplier applied to each wrong criterion's weight share. */
const WRONG_PENALTY_RATE = 0.05;

export interface WeightedCriterion {
  id: string;
  weight: number;
}

export interface MeterTraceEntry {
  turnIndex: number;
  value: number;
}

export interface MeterResult {
  /** Raw meter value before smoothing (0–100). */
  raw: number;
  /** Displayed meter value after smoothing (0–100). */
  value: number;
  /** True when two consecutive candidate turns raised no criterion status. */
  stalled: boolean;
}

/**
 * Compute the raw meter value from criterion states and weights.
 *
 * meter = 100 × Σ(weight × points)
 * Then subtract a penalty of 5 % of each wrong criterion's weight-share.
 * Floor at 0.
 */
export function computeRawMeter(
  criteria: WeightedCriterion[],
  states: CriterionState[]
): number {
  const byId = new Map(states.map((s) => [s.criterionId, s]));

  let weighted = 0;
  let wrongPenalty = 0;

  for (const criterion of criteria) {
    const status = byId.get(criterion.id)?.status ?? "not_covered";
    weighted += criterion.weight * statusPoints[status];
    if (status === "wrong") {
      wrongPenalty += WRONG_PENALTY_RATE * criterion.weight;
    }
  }

  const raw = Math.round(Math.max(0, (weighted - wrongPenalty) * 100));
  return raw;
}

/**
 * Smooth the meter so it never drops more than MAX_DROP points in one update.
 */
export function smoothMeter(raw: number, previous: number): number {
  if (raw >= previous) return raw;
  return Math.max(raw, previous - MAX_DROP);
}

/**
 * Detect whether the session has stalled: two consecutive candidate turns
 * raised no criterion status.
 *
 * We compare the last two sets of criterion-states recorded in the meter trace.
 * If neither of the last two candidate turns improved any criterion, stalled = true.
 */
export function detectStall(
  transcript: TranscriptTurn[],
  currentStates: CriterionState[],
  previousStates: CriterionState[]
): boolean {
  // We need at least two candidate turns to detect a stall.
  const candidateTurnCount = transcript.filter((t) => t.speaker === "candidate").length;
  if (candidateTurnCount < 2) return false;

  // Compare current vs previous: did any criterion move upward?
  const prevById = new Map(previousStates.map((s) => [s.criterionId, s]));
  const anyUpward = currentStates.some((cur) => {
    const prev = prevById.get(cur.criterionId);
    if (!prev) return cur.status !== "not_covered";
    return statusRank[cur.status] > statusRank[prev.status];
  });

  return !anyUpward;
}

/**
 * Full meter computation: raw score, smoothing, stall detection.
 */
export function computeMeter(
  criteria: WeightedCriterion[],
  currentStates: CriterionState[],
  previousStates: CriterionState[],
  previousMeterValue: number,
  transcript: TranscriptTurn[]
): MeterResult {
  const raw = computeRawMeter(criteria, currentStates);
  const value = smoothMeter(raw, previousMeterValue);
  const stalled = detectStall(transcript, currentStates, previousStates);
  return { raw, value, stalled };
}
