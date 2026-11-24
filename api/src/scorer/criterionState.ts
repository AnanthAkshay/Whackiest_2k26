import type { SkillRubric } from "../rubric";
import type { CriterionState, CriterionStatus } from "../types";
import { computeRawMeter } from "../meter";

const rank: Record<CriterionStatus, number> = {
  not_covered: 0,
  wrong: 0,
  partial: 1,
  correct: 2
};

export function initialCriterionStates(rubric: SkillRubric): CriterionState[] {
  return rubric.criteria.map((criterion) => ({ criterionId: criterion.id, status: "not_covered", evidenceQuote: "" }));
}

export function meterForCriterionStates(rubric: SkillRubric, states: CriterionState[]): number {
  return computeRawMeter(rubric.criteria, states);
}

export function mergeCriterionStates(rubric: SkillRubric, current: CriterionState[], proposed: CriterionState[]): CriterionState[] {
  const currentById = new Map((current.length > 0 ? current : initialCriterionStates(rubric)).map((state) => [state.criterionId, state]));
  const proposedById = new Map(proposed.map((state) => [state.criterionId, state]));
  return rubric.criteria.map((criterion) => {
    const previous = currentById.get(criterion.id) ?? { criterionId: criterion.id, status: "not_covered" as const, evidenceQuote: "" };
    const next = proposedById.get(criterion.id);
    if (!next) return previous;
    if (rank[next.status] >= rank[previous.status] || next.status === "wrong") return next;
    return previous;
  });
}

export function nextProbeFromStates(rubric: SkillRubric, states: CriterionState[]): string {
  const byId = new Map(states.map((state) => [state.criterionId, state]));
  return rubric.criteria.find((criterion) => byId.get(criterion.id)?.status !== "correct")?.id ?? rubric.criteria[0].id;
}
