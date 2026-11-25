import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadChallengeRubric,
  loadSkillRubric,
  validateChallengeCheckIds,
  validateChallengeRubric,
  validateRubric,
  type SkillRubric
} from "./rubric";
import { LocalFileStore } from "./store/LocalFileStore";
import type { AssessmentAttempt } from "./domain/types";

const criterion = (id: string, weight: number): SkillRubric["criteria"][number] => ({
  id,
  name: id,
  weight,
  mo200Area: "Manage data cells and ranges",
  sourceRefs: [0],
  sourceStatus: "grounded",
  whatCorrectCovers: ["one", "two", "three", "four"],
  commonMisconceptions: ["first", "second"],
  followUpProbes: [
    { level: "easy", question: "one" },
    { level: "medium", question: "two" },
    { level: "deep", question: "three" }
  ]
});

const baseRubric = (criteria = [criterion("cells", 1)]): SkillRubric => ({
  skill: "test-skill",
  version: "1.0.0",
  basis: "public-sources",
  basisNote: "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot.",
  trainerCoSigned: false,
  sources: [{ title: "Source", url: "https://example.test", accessed: "2026-11-24" }],
  languages: ["en"],
  criteria
});

test("loads the source-grounded Excel rubric with exact basisNote and trainerCoSigned=false", async () => {
  const rubric = await loadSkillRubric("excel");
  assert.equal(rubric.criteria.length, 6);
  assert.equal(rubric.criteria.reduce((total, item) => total + item.weight, 0), 1);
  assert.equal(rubric.trainerCoSigned, false);
  assert.equal(
    rubric.basisNote,
    "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."
  );
  assert.equal(/trainer-verified/i.test(JSON.stringify(rubric)), false);
});

test("loads Retail Sales Cleanup challenge rubric with levels, critical flags, and skill mappings", async () => {
  const warnings: string[] = [];
  const challenge = await loadChallengeRubric("retail_sales_cleanup", {
    warn: (msg) => warnings.push(msg)
  });

  assert.equal(challenge.version, "1.0.0");
  assert.equal(challenge.trainerCoSigned, false);
  assert.equal(challenge.checks.length, 6);
  assert.ok(Math.abs(challenge.checks.reduce((sum, c) => sum + c.weight, 0) - 1) < 0.000001);
  assert.ok(warnings.some((w) => w.includes("unreviewed public-source material")));
  assert.match(challenge.reviewNote, /Trainer co-sign is planned for the pilot/);
  assert.equal(/trainer-verified/i.test(JSON.stringify(challenge)), false);
});

test("rejects invalid weight totals, duplicate ids, missing sourceRefs, and trainer-verified claims", () => {
  assert.throws(() => validateRubric(baseRubric([criterion("cells", 0.9)])), /weights must sum to 1/);
  assert.throws(() => validateRubric(baseRubric([criterion("cells", 0.5), criterion("cells", 0.5)])), /ids must be unique/);

  const badSourceRef = { ...criterion("cells", 1), sourceRefs: [99] };
  assert.throws(() => validateRubric(baseRubric([badSourceRef])), /missing or invalid sourceRef/);

  const dishonest = { ...baseRubric(), basisNote: "This is trainer-verified." };
  assert.throws(() => validateRubric(dishonest), /must not claim 'trainer-verified'/);
});

test("rejects unknown linked skill criteria and unknown challenge check ids", async () => {
  const skillRubric = await loadSkillRubric("excel");
  const challenge = await loadChallengeRubric("retail_sales_cleanup", { warn: () => {} });

  const brokenLink = {
    ...challenge,
    checks: challenge.checks.map((c, idx) =>
      idx === 0 ? { ...c, linkedSkillCriterionId: "non_existent_skill_criterion" } : c
    )
  };
  assert.throws(
    () => validateChallengeRubric(brokenLink, skillRubric, { warn: () => {} }),
    /unknown skill criterion/
  );

  assert.throws(
    () => validateChallengeCheckIds(challenge, ["chk_structure_sheets", "chk_unknown_99"]),
    /Unknown challenge check id/
  );
});

test("reports every unverified criterion through the supplied logger", () => {
  const messages: string[] = [];
  const unverified = { ...criterion("cells", 1), sourceStatus: "unverified" as const };
  validateRubric(baseRubric([unverified]), { warn: (message) => messages.push(message) });
  assert.deepEqual(messages, ["Rubric 'test-skill' criterion 'cells' has unverified sources."]);
});

test("rubric versions remain immutable once an AssessmentAttempt begins", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-rubric-immut-"));
  try {
    const store = new LocalFileStore(dir);
    const attempt: AssessmentAttempt = {
      attemptId: "att_immut_01",
      userId: "user_1",
      challengeId: "retail_sales_cleanup",
      seedId: "seed_1",
      skillRubricVersion: "1.0.0",
      challengeRubricVersion: "1.0.0",
      status: "DRAFT",
      startedAt: "2026-11-25T00:00:00.000Z",
      updatedAt: "2026-11-25T00:00:00.000Z"
    };
    await store.createAttempt(attempt);

    await assert.rejects(
      async () =>
        await store.saveAttempt({
          ...attempt,
          challengeRubricVersion: "2.0.0"
        }),
      /immutable/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
