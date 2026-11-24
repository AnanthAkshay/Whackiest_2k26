import type { SkillRubric } from "../rubric";
import type { CriterionState, Session, SkillRecord } from "../types";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface TurnEvaluation {
  understanding: number;
  stalled: boolean;
  coveredCriterionIds: string[];
  criterionStates: CriterionState[];
  nextProbeCriterionId: string;
  tokenUsage?: TokenUsage;
}

export interface FinalScoreResult {
  record: SkillRecord;
  tokenUsage?: TokenUsage;
}

export interface Scorer {
  evaluateTurn(session: Session, rubric: SkillRubric): Promise<TurnEvaluation>;
  finalScore(session: Session, rubric: SkillRubric): Promise<FinalScoreResult>;
}
