import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildReferenceWorkbookForTest } from "../challenge/datasetGenerator";
import { runPythonValidator } from "./pythonValidator";

test("runPythonValidator executes Python validator subprocess and returns validated FactSheet", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-pyval-"));
  try {
    const { buffer, expectedOutputs } = buildReferenceWorkbookForTest("seed_node_py_01");
    const filePath = join(dir, "ref.xlsx");
    await writeFile(filePath, buffer);

    const sheet = await runPythonValidator({
      filePath,
      attemptId: "att_node_01",
      artifactId: "art_node_01",
      expectedOutputs
    });

    assert.equal(sheet.status, "ok");
    assert.equal(sheet.practicalScore, 100);
    assert.equal(sheet.attemptId, "att_node_01");
    assert.equal(sheet.artifactId, "art_node_01");
    assert.equal(sheet.checkResults.length, 6);
    assert.ok(sheet.checkResults.every((c) => c.status === "pass"));
    assert.equal(sheet.duplicateCounts.duplicateOrderIds, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
