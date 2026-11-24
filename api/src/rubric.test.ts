import assert from "node:assert/strict";
import test from "node:test";
import { loadSkillRubric, validateRubric, type SkillRubric } from "./rubric";

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
  basisNote: "Source note.",
  trainerCoSigned: false,
  sources: [{ title: "Source", url: "https://example.test", accessed: "2026-11-24" }],
  languages: ["en"],
  criteria
});

test("loads the source-grounded Excel rubric", async () => {
  const rubric = await loadSkillRubric("excel");
  assert.equal(rubric.criteria.length, 6);
  assert.equal(rubric.criteria.reduce((total, item) => total + item.weight, 0), 1);
  assert.equal(rubric.trainerCoSigned, false);
});

test("rejects invalid weight totals and duplicate ids", () => {
  assert.throws(() => validateRubric(baseRubric([criterion("cells", 0.9)])), /weights must sum to 1/);
  assert.throws(() => validateRubric(baseRubric([criterion("cells", 0.5), criterion("cells", 0.5)])), /ids must be unique/);
});

test("reports every unverified criterion through the supplied logger", () => {
  const messages: string[] = [];
  const unverified = { ...criterion("cells", 1), sourceStatus: "unverified" as const };
  validateRubric(baseRubric([unverified]), { warn: (message) => messages.push(message) });
  assert.deepEqual(messages, ["Rubric 'test-skill' criterion 'cells' has unverified sources."]);
});
