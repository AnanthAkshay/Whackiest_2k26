import { randomUUID } from "node:crypto";
import type { ChallengeRubricFile, SkillRubric } from "../rubric";
import type { FactSheet } from "../validator/pythonValidator";
import type {
  AssessmentOutcome,
  AssessmentResult,
  AuditEvent,
  CriterionEvidence,
  ReviewFlag,
  VivaTurn
} from "../domain/types";

export type CriterionScaleLevel = 0 | 1 | 2;

export const ECVE_WEIGHTS = {
  P: 0.6,
  U: 0.25,
  C: 0.15
} as const;

export interface WeightedScaleItem {
  criterionId: string;
  dimension: "P" | "U" | "C";
  weight: number;
  level: CriterionScaleLevel;
  critical?: boolean;
  evidenceQuote: string;
  reason: string;
}

export interface ReviewTriggerContext {
  lowTranscriptConfidence?: boolean;
  ambiguousEvidence?: boolean;
  technicalFairnessIssue?: boolean;
  learnerDispute?: boolean;
  minimumEvidenceMet?: boolean;
  unassessableAfterReview?: boolean;
}

export interface HumanReviewDecision {
  action: "confirm" | "adjust" | "dispute";
  actor: string;
  reason: string;
  adjustedOutcome?: AssessmentOutcome;
  adjustedComposite?: number;
  timestamp?: string;
}

export interface AuditedAssessmentRecord {
  aiResult: AssessmentResult;
  authoritativeOutcome: AssessmentOutcome;
  authoritativeComposite: number;
  credentialEligible: boolean;
  reviewResolution?: {
    action: "confirm" | "adjust" | "dispute";
    actor: string;
    reason: string;
    timestamp: string;
    previousOutcome: AssessmentOutcome;
    resolvedOutcome: AssessmentOutcome;
  };
  auditEvent: AuditEvent;
}

export function validateEcveWeights(weights = ECVE_WEIGHTS): void {
  const sum = weights.P + weights.U + weights.C;
  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(`ECVE dimension weights must sum to 1.0; received ${sum}.`);
  }
}

export function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Computes a 0-100 dimension score from 0/1/2 criterion scale items:
 * (sum(weight * level) / sum(weight * 2)) * 100
 */
export function computeDimensionScore(items: Array<{ weight: number; level: CriterionScaleLevel }>): number {
  const maxWeighted = items.reduce((sum, item) => sum + item.weight * 2, 0);
  if (maxWeighted <= 0) return 0;
  const earnedWeighted = items.reduce((sum, item) => sum + item.weight * item.level, 0);
  return normalizeScore((earnedWeighted / maxWeighted) * 100);
}

export function computeECVEComposite(P: number, U: number, C: number): {
  P: number;
  U: number;
  C: number;
  composite: number;
  roundedComposite: number;
} {
  validateEcveWeights();
  const normP = normalizeScore(P);
  const normU = normalizeScore(U);
  const normC = normalizeScore(C);
  const composite = ECVE_WEIGHTS.P * normP + ECVE_WEIGHTS.U * normU + ECVE_WEIGHTS.C * normC;
  return {
    P: normP,
    U: normU,
    C: normC,
    composite,
    roundedComposite: Math.round(composite * 100) / 100
  };
}

/**
 * Evaluates Practical Execution (P) strictly from FactSheet + ChallengeRubric weights.
 */
export function evaluatePracticalDimension(
  factSheet: FactSheet,
  challengeRubric: ChallengeRubricFile
): {
  score: number;
  criticalPassed: boolean;
  items: WeightedScaleItem[];
  reviewFlags: ReviewFlag[];
} {
  const items: WeightedScaleItem[] = [];
  const reviewFlags: ReviewFlag[] = [];
  let criticalPassed = true;
  const now = new Date().toISOString();

  for (const chk of challengeRubric.checks) {
    const res = factSheet.checkResults.find((r) => r.checkId === chk.checkId);
    let level: CriterionScaleLevel = 0;

    if (!res || res.status === "unknown") {
      level = 0;
      if (chk.critical) criticalPassed = false;
      reviewFlags.push({
        code: "AMBIGUOUS_VALIDATOR_CHECK",
        message: `Objective check '${chk.name}' could not be evaluated safely and requires review.`,
        severity: "high",
        triggeredAt: now
      });
    } else if (res.status === "pass") {
      level = 2;
    } else if (res.score > 0 && res.score < res.maxScore) {
      level = 1;
      if (chk.critical) criticalPassed = false;
    } else {
      level = 0;
      if (chk.critical) criticalPassed = false;
    }

    items.push({
      criterionId: chk.checkId,
      dimension: "P",
      weight: chk.weight,
      level,
      critical: chk.critical,
      evidenceQuote: res?.sourceRef ?? "Workbook",
      reason: res?.explanation ?? "Check result missing from validation report."
    });
  }

  return {
    score: computeDimensionScore(items),
    criticalPassed,
    items,
    reviewFlags
  };
}

/**
 * Extracts candidate-only speech/text turns (never grading AI Examiner turns).
 */
export function extractCandidateText(turns: VivaTurn[]): string {
  return turns
    .filter((t) => t.speaker === "candidate")
    .map((t) => t.text.trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * Evaluates Evidence Consistency (C) by comparing candidate's spoken claims
 * against verified FactSheet facts. Mismatches are review signals, NOT cheating proof.
 */
export function evaluateConsistencyDimension(
  turns: VivaTurn[],
  factSheet: FactSheet
): {
  score: number;
  items: WeightedScaleItem[];
  reviewFlags: ReviewFlag[];
} {
  const candidateSpeech = extractCandidateText(turns).toLowerCase();
  const now = new Date().toISOString();
  const reviewFlags: ReviewFlag[] = [];

  const sumFact = factSheet.formulaFacts.find((f) => f.metric.toLowerCase().includes("total revenue"));
  const dupCheck = factSheet.checkResults.find((c) => c.checkId === "chk_duplicates_removed");

  const claimsSumFormula = /\bsum\b|=sum/i.test(candidateSpeech);
  const claimsDuplicatesRemoved = /\bduplicate|unique|removed\b/i.test(candidateSpeech);

  let formulaConsistencyLevel: CriterionScaleLevel = 1;
  let formulaReason = "Candidate did not explicitly reference summary formulas.";
  if (claimsSumFormula) {
    if (sumFact && sumFact.status === "pass") {
      formulaConsistencyLevel = 2;
      formulaReason = `Candidate's explanation of =SUM aligns with verified fact (${sumFact.sourceRef}).`;
    } else {
      formulaConsistencyLevel = 0;
      formulaReason = "Candidate claimed using =SUM, but the submitted workbook did not pass the verified formula check.";
      reviewFlags.push({
        code: "EXPLANATION_ARTIFACT_MISMATCH",
        message: "Spoken claim about =SUM differs from the submitted workbook facts. Routed as a review signal (not proof of cheating).",
        severity: "high",
        triggeredAt: now
      });
    }
  }

  let dupConsistencyLevel: CriterionScaleLevel = 1;
  let dupReason = "Candidate did not explicitly mention duplicate handling.";
  if (claimsDuplicatesRemoved) {
    if (dupCheck && dupCheck.status === "pass") {
      dupConsistencyLevel = 2;
      dupReason = `Candidate's explanation of duplicate removal aligns with ${dupCheck.sourceRef}.`;
    } else {
      dupConsistencyLevel = 0;
      dupReason = "Candidate claimed duplicates were removed, but duplicate Order IDs remain in the workbook.";
      reviewFlags.push({
        code: "EXPLANATION_ARTIFACT_MISMATCH",
        message: "Spoken claim about duplicate removal differs from workbook duplicate count. Routed for review.",
        severity: "high",
        triggeredAt: now
      });
    }
  }

  const items: WeightedScaleItem[] = [
    {
      criterionId: "consistency_formulas",
      dimension: "C",
      weight: 0.5,
      level: formulaConsistencyLevel,
      evidenceQuote: sumFact?.sourceRef ?? "Summary!B2",
      reason: formulaReason
    },
    {
      criterionId: "consistency_duplicates",
      dimension: "C",
      weight: 0.5,
      level: dupConsistencyLevel,
      evidenceQuote: dupCheck?.sourceRef ?? "Sales_Data!A2",
      reason: dupReason
    }
  ];

  return {
    score: computeDimensionScore(items),
    items,
    reviewFlags
  };
}

/**
 * Authoritative deterministic ECVE Outcome Decision Matrix.
 */
export function determineECVEOutcome(params: {
  composite: number;
  criticalCriteriaPassed: boolean;
  reviewFlags: ReviewFlag[];
  context?: ReviewTriggerContext;
}): { outcome: AssessmentOutcome; credentialEligible: boolean; explanation: string } {
  const ctx = params.context ?? {};
  const minimumEvidenceMet = ctx.minimumEvidenceMet ?? true;

  if (ctx.unassessableAfterReview) {
    return {
      outcome: "Not yet demonstrated",
      credentialEligible: false,
      explanation: "Attempt marked unassessable after human review."
    };
  }

  const hasHighRiskReviewFlag = params.reviewFlags.some((f) => f.severity === "high");
  if (
    hasHighRiskReviewFlag ||
    ctx.lowTranscriptConfidence ||
    ctx.ambiguousEvidence ||
    ctx.technicalFairnessIssue ||
    ctx.learnerDispute
  ) {
    const reasons: string[] = [];
    if (ctx.lowTranscriptConfidence) reasons.push("low speech recognition confidence (not penalized as low knowledge)");
    if (ctx.ambiguousEvidence) reasons.push("ambiguous workbook/viva evidence");
    if (ctx.technicalFairnessIssue) reasons.push("technical fairness issue");
    if (ctx.learnerDispute) reasons.push("learner dispute");
    if (hasHighRiskReviewFlag) reasons.push("explanation-artifact mismatch or unverified check");

    return {
      outcome: "Pending Human Review",
      credentialEligible: false,
      explanation: `Routed for human review due to: ${reasons.join(", ")}. This is a fair review signal, not a fail.`
    };
  }

  if (params.composite < 40) {
    return {
      outcome: "Not yet demonstrated",
      credentialEligible: false,
      explanation: `Composite score (${params.composite.toFixed(2)}) is below 40.`
    };
  }

  if (params.composite >= 75 && params.criticalCriteriaPassed && minimumEvidenceMet) {
    return {
      outcome: "Demonstrated",
      credentialEligible: true,
      explanation: `Composite score (${params.composite.toFixed(2)}) >= 75, all critical criteria passed, and minimum evidence met.`
    };
  }

  return {
    outcome: "Partially demonstrated",
    credentialEligible: false,
    explanation: !params.criticalCriteriaPassed
      ? `Composite score is ${params.composite.toFixed(2)}, but one or more critical criteria failed.`
      : !minimumEvidenceMet
      ? `Composite score is ${params.composite.toFixed(2)}, but minimum evidence requirements were not met.`
      : `Composite score (${params.composite.toFixed(2)}) is between 40 and 75.`
  };
}

/**
 * Full deterministic ECVE evaluation combining P (60%), U (25%), and C (15%).
 */
export function evaluateECVEAssessment(params: {
  attemptId: string;
  userId: string;
  factSheet: FactSheet;
  challengeRubric: ChallengeRubricFile;
  skillRubric: SkillRubric;
  turns: VivaTurn[];
  understandingItems: WeightedScaleItem[];
  context?: ReviewTriggerContext;
  idempotencyKey?: string;
}): AssessmentResult {
  const practical = evaluatePracticalDimension(params.factSheet, params.challengeRubric);
  const understandingScore = computeDimensionScore(params.understandingItems);
  const consistency = evaluateConsistencyDimension(params.turns, params.factSheet);

  const allFlags = [...practical.reviewFlags, ...consistency.reviewFlags];
  const { P, U, C, composite, roundedComposite } = computeECVEComposite(
    practical.score,
    understandingScore,
    consistency.score
  );

  const decision = determineECVEOutcome({
    composite,
    criticalCriteriaPassed: practical.criticalPassed,
    reviewFlags: allFlags,
    context: params.context
  });

  const allItems = [...practical.items, ...params.understandingItems, ...consistency.items];
  const criterionEvidence: CriterionEvidence[] = allItems.map((item) => ({
    criterionId: item.criterionId,
    dimension: item.dimension,
    status: item.level === 2 ? "correct" : item.level === 1 ? "partial" : "not_covered",
    score: item.level === 2 ? 100 : item.level === 1 ? 50 : 0,
    evidenceQuote: item.evidenceQuote,
    reason: item.reason
  }));

  return {
    resultId: `res_${randomUUID().slice(0, 12)}`,
    attemptId: params.attemptId,
    userId: params.userId,
    dimensions: { P, U, C },
    weights: { ...ECVE_WEIGHTS },
    composite: roundedComposite,
    outcome: decision.outcome,
    criticalCriteriaPassed: practical.criticalPassed,
    criterionEvidence,
    reviewFlags: allFlags,
    skillRubricVersion: params.skillRubric.version,
    challengeRubricVersion: params.challengeRubric.version,
    evaluatedAt: new Date().toISOString(),
    idempotencyKey: params.idempotencyKey
  };
}

/**
 * Allows a mentor/trainer/reviewer to confirm, adjust, or dispute an AI result
 * while preserving the original AI result and recording an auditable AuditEvent.
 */
export function applyHumanReviewDecision(
  aiResult: AssessmentResult,
  decision: HumanReviewDecision
): AuditedAssessmentRecord {
  const timestamp = decision.timestamp ?? new Date().toISOString();
  const resolvedOutcome: AssessmentOutcome =
    decision.action === "confirm"
      ? aiResult.outcome === "Pending Human Review"
        ? aiResult.composite >= 75 && aiResult.criticalCriteriaPassed
          ? "Demonstrated"
          : aiResult.composite >= 40
          ? "Partially demonstrated"
          : "Not yet demonstrated"
        : aiResult.outcome
      : decision.adjustedOutcome ?? aiResult.outcome;

  const resolvedComposite = decision.adjustedComposite ?? aiResult.composite;

  const auditEvent: AuditEvent = {
    eventId: `evt_${randomUUID().slice(0, 10)}`,
    entityType: "result",
    entityId: aiResult.resultId,
    userId: aiResult.userId,
    action: `HUMAN_REVIEW_${decision.action.toUpperCase()}`,
    details: {
      actor: decision.actor,
      reason: decision.reason,
      aiOutcome: aiResult.outcome,
      resolvedOutcome,
      aiComposite: aiResult.composite,
      resolvedComposite
    },
    timestamp
  };

  return {
    aiResult,
    authoritativeOutcome: resolvedOutcome,
    authoritativeComposite: resolvedComposite,
    credentialEligible: resolvedOutcome === "Demonstrated",
    reviewResolution: {
      action: decision.action,
      actor: decision.actor,
      reason: decision.reason,
      timestamp,
      previousOutcome: aiResult.outcome,
      resolvedOutcome
    },
    auditEvent
  };
}
