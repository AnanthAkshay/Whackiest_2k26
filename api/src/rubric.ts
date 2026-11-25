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

export interface ChallengeCheckLevels {
  "0": string;
  "1": string;
  "2": string;
}

export interface ChallengeRubricCheck {
  checkId: string;
  name: string;
  weight: number;
  critical: boolean;
  sourceStatus: SourceStatus;
  sourceRefs: number[];
  linkedSkillCriterionId: string;
  mappingNote: string;
  validatorMeasurement: string;
  vivaFactRefs: string[];
  acceptableEvidence: string;
  levels: ChallengeCheckLevels;
}

export interface ChallengeRubricFile {
  challengeId: string;
  roleId: string;
  title: string;
  version: string;
  skillRubricId: string;
  skillRubricVersion: string;
  basis: "public-sources";
  basisNote: string;
  reviewNote: string;
  trainerCoSigned: boolean;
  sources: RubricSource[];
  acceptedFormats: string[];
  maxSizeBytes: number;
  expectedSheets: string[];
  expectedColumns: string[];
  checks: ChallengeRubricCheck[];
}

interface ValidationOptions {
  warn?: (message: string) => void;
}

const weightTolerance = 0.000001;
const defaultRubricsDirectory = existsSync(resolve(process.cwd(), "rubrics"))
  ? resolve(process.cwd(), "rubrics")
  : resolve(process.cwd(), "..", "rubrics");

function rubricError(id: string, message: string): Error {
  return new Error(`Invalid rubric '${id}': ${message}`);
}

export function validateRubric(rubric: SkillRubric, options: ValidationOptions = {}): SkillRubric {
  if (!rubric.basisNote?.trim()) throw rubricError(rubric.skill, "basisNote is required.");
  if (/trainer-verified/i.test(rubric.basisNote)) {
    throw rubricError(rubric.skill, "basisNote must not claim 'trainer-verified'.");
  }

  const weightTotal = rubric.criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (Math.abs(weightTotal - 1) > weightTolerance) {
    throw rubricError(rubric.skill, `criterion weights must sum to 1; received ${weightTotal}.`);
  }

  const ids = rubric.criteria.map((criterion) => criterion.id);
  if (new Set(ids).size !== ids.length) throw rubricError(rubric.skill, "criterion ids must be unique.");

  for (const criterion of rubric.criteria) {
    if (!criterion.sourceRefs?.length) {
      throw rubricError(rubric.skill, `criterion '${criterion.id}' must include sourceRefs.`);
    }
    for (const ref of criterion.sourceRefs) {
      if (!Number.isInteger(ref) || ref < 0 || ref >= rubric.sources.length) {
        throw rubricError(rubric.skill, `criterion '${criterion.id}' has missing or invalid sourceRef ${ref}.`);
      }
    }
    if (criterion.whatCorrectCovers.length < 4) {
      throw rubricError(rubric.skill, `criterion '${criterion.id}' needs at least 4 whatCorrectCovers items.`);
    }
    if (!criterion.commonMisconceptions?.length) {
      throw rubricError(rubric.skill, `criterion '${criterion.id}' must define commonMisconceptions.`);
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

export function validateChallengeRubric(
  rubric: ChallengeRubricFile,
  skillRubric?: SkillRubric,
  options: ValidationOptions = {}
): ChallengeRubricFile {
  const warn = options.warn ?? console.warn;

  if (!rubric.basisNote?.trim()) throw rubricError(rubric.challengeId, "basisNote is required.");
  if (!rubric.reviewNote?.trim()) throw rubricError(rubric.challengeId, "reviewNote is required.");
  if (/trainer-verified/i.test(rubric.basisNote) || /trainer-verified/i.test(rubric.reviewNote)) {
    throw rubricError(rubric.challengeId, "Challenge rubric must not claim 'trainer-verified'.");
  }

  const weightTotal = rubric.checks.reduce((total, chk) => total + chk.weight, 0);
  if (Math.abs(weightTotal - 1) > weightTolerance) {
    throw rubricError(rubric.challengeId, `check weights must sum to 1; received ${weightTotal}.`);
  }

  const ids = rubric.checks.map((chk) => chk.checkId);
  if (new Set(ids).size !== ids.length) throw rubricError(rubric.challengeId, "check ids must be unique.");

  const validSkillIds = skillRubric ? new Set(skillRubric.criteria.map((c) => c.id)) : undefined;

  for (const chk of rubric.checks) {
    if (typeof chk.critical !== "boolean") {
      throw rubricError(rubric.challengeId, `check '${chk.checkId}' must define boolean critical flag.`);
    }
    if (!chk.acceptableEvidence?.trim()) {
      throw rubricError(rubric.challengeId, `check '${chk.checkId}' must define acceptableEvidence.`);
    }
    if (!chk.levels?.["0"]?.trim() || !chk.levels?.["1"]?.trim() || !chk.levels?.["2"]?.trim()) {
      throw rubricError(rubric.challengeId, `check '${chk.checkId}' must define levels 0, 1, and 2.`);
    }
    if (!chk.validatorMeasurement?.trim() || !chk.vivaFactRefs?.length) {
      throw rubricError(rubric.challengeId, `check '${chk.checkId}' must define validatorMeasurement and vivaFactRefs.`);
    }
    if (!chk.sourceRefs?.length) {
      throw rubricError(rubric.challengeId, `check '${chk.checkId}' must include sourceRefs.`);
    }
    for (const ref of chk.sourceRefs) {
      if (!Number.isInteger(ref) || ref < 0 || ref >= rubric.sources.length) {
        throw rubricError(rubric.challengeId, `check '${chk.checkId}' has missing or invalid sourceRef ${ref}.`);
      }
    }
    if (validSkillIds && !validSkillIds.has(chk.linkedSkillCriterionId)) {
      throw rubricError(
        rubric.challengeId,
        `check '${chk.checkId}' references unknown skill criterion '${chk.linkedSkillCriterionId}'.`
      );
    }
    if (chk.sourceStatus === "unverified") {
      warn(`Challenge rubric '${rubric.challengeId}' check '${chk.checkId}' has unverified sources.`);
    }
  }

  if (!rubric.trainerCoSigned) {
    warn(`Challenge rubric '${rubric.challengeId}' v${rubric.version} is unreviewed public-source material (trainerCoSigned=false).`);
  }

  return rubric;
}

export function validateChallengeCheckIds(
  rubric: ChallengeRubricFile,
  checkIds: string[]
): void {
  const known = new Set(rubric.checks.map((c) => c.checkId));
  for (const id of checkIds) {
    if (!known.has(id)) {
      throw new Error(`Unknown challenge check id '${id}' for challenge '${rubric.challengeId}'.`);
    }
  }
}

export async function loadSkillRubrics(rubricsDirectory = process.env.RUBRICS_DIR ?? defaultRubricsDirectory): Promise<SkillRubric[]> {
  const files = (await readdir(rubricsDirectory)).filter((file) => file.endsWith(".json")).sort();
  const rubrics: SkillRubric[] = [];
  for (const file of files) {
    const content = await readFile(resolve(rubricsDirectory, file), "utf8");
    const parsed = JSON.parse(content) as Partial<SkillRubric> & { challengeId?: string };
    if (parsed.challengeId && !Array.isArray(parsed.criteria)) continue;
    rubrics.push(validateRubric(parsed as SkillRubric));
  }
  return rubrics;
}

export async function loadSkillRubric(skill: string): Promise<SkillRubric> {
  const rubric = (await loadSkillRubrics()).find((entry) => entry.skill === skill);
  if (!rubric) throw new Error(`No rubric found for skill '${skill}'.`);
  return rubric;
}

export async function loadChallengeRubrics(
  rubricsDirectory = process.env.RUBRICS_DIR ?? defaultRubricsDirectory,
  options: ValidationOptions = {}
): Promise<ChallengeRubricFile[]> {
  const files = (await readdir(rubricsDirectory)).filter((file) => file.endsWith(".json")).sort();
  const skillRubrics = await loadSkillRubrics(rubricsDirectory);
  const results: ChallengeRubricFile[] = [];

  for (const file of files) {
    const content = await readFile(resolve(rubricsDirectory, file), "utf8");
    const parsed = JSON.parse(content) as Partial<ChallengeRubricFile>;
    if (!parsed.challengeId || !Array.isArray(parsed.checks)) continue;
    const challenge = parsed as ChallengeRubricFile;
    const linkedSkill = skillRubrics.find((s) => s.skill === challenge.skillRubricId);
    results.push(validateChallengeRubric(challenge, linkedSkill, options));
  }
  return results;
}

export async function loadChallengeRubric(
  challengeId: string,
  options: ValidationOptions = {}
): Promise<ChallengeRubricFile> {
  const challenge = (await loadChallengeRubrics(undefined, options)).find(
    (entry) => entry.challengeId === challengeId
  );
  if (!challenge) throw new Error(`No challenge rubric found for '${challengeId}'.`);
  return challenge;
}

export async function listSkillSummaries(): Promise<SkillSummary[]> {
  return (await loadSkillRubrics()).map(({ skill, languages, basisNote, trainerCoSigned }) => ({
    skill,
    languages,
    basisNote,
    trainerCoSigned
  }));
}
