import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildReferenceWorkbookForTest } from "../challenge/datasetGenerator";
import { runPythonValidator } from "./pythonValidator";

async function main(): Promise<void> {
  const seedId = "seed_fixture_demo_01";
  const { buffer, expectedOutputs } = buildReferenceWorkbookForTest(seedId);

  const tmpFile = resolve(process.cwd(), ".data", "fixture_reference_temp.xlsx");
  await mkdir(resolve(process.cwd(), ".data"), { recursive: true });
  await writeFile(tmpFile, buffer);

  try {
    const factSheet = await runPythonValidator({
      filePath: tmpFile,
      attemptId: "att_fixture_01",
      artifactId: "art_fixture_01",
      expectedOutputs
    });

    const outPath = resolve(process.cwd(), "validator", "sample_fact_sheet.json");
    await writeFile(outPath, `${JSON.stringify(factSheet, null, 2)}\n`, "utf8");

    console.log("=================================================");
    console.log("  Prooffolio - Deterministic Validator Fixture   ");
    console.log("=================================================");
    console.log(`Status          : ${factSheet.status}`);
    console.log(`Practical Score : ${factSheet.practicalScore} / 100`);
    console.log(`Validator Ver   : ${factSheet.validatorVersion}`);
    console.log(`File Hash       : ${factSheet.fileHash}`);
    console.log(`Checks Passed   : ${factSheet.checkResults.filter((c) => c.status === "pass").length}/${factSheet.checkResults.length}`);
    console.log(`Sample written  : ${outPath}`);
  } finally {
    await rm(tmpFile, { force: true }).catch(() => {});
  }
}

void main();
