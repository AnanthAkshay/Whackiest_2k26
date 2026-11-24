import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type SourceStatus = "grounded" | "unverified";

export interface RubricSource {
  title: string;
  url: string;
  accessed: string;
}

export interface FollowUpProbe {
  level: "easy" | "medium" | "deep";
  question: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number;
  mo200Area: string;
  sourceRefs: number[];
  sourceStatus: SourceStatus;
  whatCorrectCovers: string[];
  commonMisconceptions: string[];
  followUpProbes: FollowUpProbe[];
}

export interface SkillRubric {
  skill: string;
  version: string;
  basis: "public-sources";
  basisNote: string;
  trainerCoSigned: boolean;
  sources: RubricSource[];
  languages: string[];
  criteria: RubricCriterion[];
}

export interface SkillSummary {
  skill: string;
  languages: string[];
  basisNote: string;
  trainerCoSigned: boolean;
}

interface ValidationOptions {
  warn?: (message: string) => void;
}

const weightTolerance = 0.000001;
const defaultRubricsDirectory = existsSync(resolve(process.cwd(), "rubrics"))
  ? resolve(process.cwd(), "rubrics")
  : resolve(process.cwd(), "..", "rubrics");

function rubricError(skill: string, message: string): Error {
  return new Error(`Invalid rubric '${skill}': ${message}`);
}

export function validateRubric(rubric: SkillRubric, options: ValidationOptions = {}): SkillRubric {
  if (!rubric.basisNote?.trim()) throw rubricError(rubric.skill, "basisNote is required.");

  const weightTotal = rubric.criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (Math.abs(weightTotal - 1) > weightTolerance) {
    throw rubricError(rubric.skill, `criterion weights must sum to 1; received ${weightTotal}.`);
  }

  const ids = rubric.criteria.map((criterion) => criterion.id);
  if (new Set(ids).size !== ids.length) throw rubricError(rubric.skill, "criterion ids must be unique.");

  for (const criterion of rubric.criteria) {
    if (criterion.whatCorrectCovers.length < 4) {
      throw rubricError(rubric.skill, `criterion '${criterion.id}' needs at least 4 whatCorrectCovers items.`);
    }
    if (criterion.followUpProbes.length !== 3) {
      throw rubricError(rubric.skill, `criterion '${criterion.id}' must have exactly 3 followUpProbes.`);
    }
    if (criterion.sourceStatus === "unverified") {
      (options.warn ?? console.warn)(`Rubric '${rubric.skill}' criterion '${criterion.id}' has unverified sources.`);
    }
  }

  return rubric;
}

export async function loadSkillRubrics(rubricsDirectory = process.env.RUBRICS_DIR ?? defaultRubricsDirectory): Promise<SkillRubric[]> {
  const files = (await readdir(rubricsDirectory)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map(async (file) => {
    const content = await readFile(resolve(rubricsDirectory, file), "utf8");
    return validateRubric(JSON.parse(content) as SkillRubric);
  }));
}

export async function loadSkillRubric(skill: string): Promise<SkillRubric> {
  const rubric = (await loadSkillRubrics()).find((entry) => entry.skill === skill);
  if (!rubric) throw new Error(`No rubric found for skill '${skill}'.`);
  return rubric;
}

export async function listSkillSummaries(): Promise<SkillSummary[]> {
  return (await loadSkillRubrics()).map(({ skill, languages, basisNote, trainerCoSigned }) => ({ skill, languages, basisNote, trainerCoSigned }));
}
