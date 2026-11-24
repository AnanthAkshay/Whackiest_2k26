import assert from "node:assert/strict";
import test from "node:test";
import { loadSkillRubric } from "../rubric";
import { createDynamicVariables } from "./ElevenLabsAgent";

test("creates the Student prompt variables from the selected rubric", async () => {
  const rubric = await loadSkillRubric("excel");
  const variables = createDynamicVariables("excel", "tough", "kn", rubric);

  assert.deepEqual(Object.keys(variables), ["skill", "level", "language", "probes"]);
  assert.equal(variables.skill, "excel");
  assert.equal(variables.level, "tough");
  assert.equal(variables.language, "kn");
  assert.match(variables.probes, /Worksheets, workbooks and navigation/);
  assert.match(variables.probes, /Charts/);
});
