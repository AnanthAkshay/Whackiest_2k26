import assert from "node:assert/strict";
import test from "node:test";
import { buildReferenceWorkbookForTest, generateSeededChallengeDataset } from "./datasetGenerator";
import { buildXlsxBuffer, buildZipBuffer, inspectXlsxBuffer } from "./xlsxArchive";
import { startChallengeHandler, uploadArtifactHandler } from "../handlers/challenge";
import { getStore } from "../store/createStore";

test("generateSeededChallengeDataset is deterministic and produces distinct variants per seed", () => {
  const run1 = generateSeededChallengeDataset("seed_alpha_01");
  const run2 = generateSeededChallengeDataset("seed_alpha_01");
  const run3 = generateSeededChallengeDataset("seed_beta_02");

  assert.equal(run1.seed.sha256, run2.seed.sha256);
  assert.deepEqual(run1.expectedOutputs, run2.expectedOutputs);
  assert.equal(Buffer.compare(run1.starterWorkbook, run2.starterWorkbook), 0);

  assert.notEqual(run1.seed.sha256, run3.seed.sha256);
  assert.equal(run1.messyRows.length, 18); // 16 unique + 2 duplicates

  const inspection = inspectXlsxBuffer(run1.starterWorkbook, ["Sales_Data", "Summary"]);
  assert.equal(inspection.valid, true);
  assert.deepEqual(inspection.sheetNames, ["Sales_Data", "Summary"]);
});

test("startChallengeHandler creates DRAFT attempt and never exposes expectedOutputs", async () => {
  const res = await startChallengeHandler({
    body: { userId: "learner_test_01", challengeId: "retail_sales_cleanup" }
  });
  assert.equal(res.statusCode, 200);
  const body = res.body as Record<string, unknown>;
  assert.ok(body.attempt);
  assert.equal((body.attempt as { status: string }).status, "DRAFT");
  assert.equal(body.expectedOutputs, undefined);
  assert.equal(body.referenceWorkbook, undefined);
});

test("uploadArtifactHandler accepts valid XLSX, stores privately, computes SHA-256, and transitions state", async () => {
  const startRes = await startChallengeHandler({
    body: { userId: "learner_valid_01", challengeId: "retail_sales_cleanup" }
  });
  const attempt = (startRes.body as { attempt: { attemptId: string; seedId: string } }).attempt;
  const ref = buildReferenceWorkbookForTest(attempt.seedId);

  const uploadRes = await uploadArtifactHandler({
    pathParameters: { attemptId: attempt.attemptId },
    body: {
      fileName: "cleaned_sales.xlsx",
      contentBase64: ref.buffer.toString("base64"),
      idempotencyKey: "idem_valid_01",
      userId: "learner_valid_01"
    }
  });

  assert.equal(uploadRes.statusCode, 200);
  const body = uploadRes.body as {
    artifact: { artifactId: string; sha256: string; size: number; storageKey?: string };
    attempt: { status: string };
    sheets: string[];
  };
  assert.equal(body.attempt.status, "VALIDATING");
  assert.equal(body.artifact.sha256.length, 64);
  assert.equal(body.artifact.storageKey, undefined, "Public response must not expose internal storageKey");
  assert.deepEqual(body.sheets, ["Sales_Data", "Summary"]);

  // Verify audit event recorded
  const audits = await getStore().listAuditEvents(body.artifact.artifactId);
  assert.ok(audits.some((e) => e.action === "ARTIFACT_UPLOADED"));

  // Repeated submit with same idempotencyKey returns same artifactId
  const retrySameKey = await uploadArtifactHandler({
    pathParameters: { attemptId: attempt.attemptId },
    body: {
      fileName: "cleaned_sales.xlsx",
      contentBase64: ref.buffer.toString("base64"),
      idempotencyKey: "idem_valid_01",
      userId: "learner_valid_01"
    }
  });
  assert.equal(retrySameKey.statusCode, 200);
  assert.equal(
    (retrySameKey.body as { artifact: { artifactId: string } }).artifact.artifactId,
    body.artifact.artifactId
  );

  // Retry with a new idempotencyKey (duplicate file retry) succeeds cleanly
  const retryNewKey = await uploadArtifactHandler({
    pathParameters: { attemptId: attempt.attemptId },
    body: {
      fileName: "cleaned_sales_v2.xlsx",
      contentBase64: ref.buffer.toString("base64"),
      idempotencyKey: "idem_valid_02",
      userId: "learner_valid_01"
    }
  });
  assert.equal(retryNewKey.statusCode, 200);
  assert.notEqual(
    (retryNewKey.body as { artifact: { artifactId: string } }).artifact.artifactId,
    body.artifact.artifactId
  );
});

test("uploadArtifactHandler rejects wrong extension, oversized file, macro-enabled file, malformed ZIP, and missing sheet", async () => {
  const startRes = await startChallengeHandler({
    body: { userId: "learner_reject_01", challengeId: "retail_sales_cleanup" }
  });
  const attemptId = (startRes.body as { attempt: { attemptId: string } }).attempt.attemptId;

  // 1. Wrong extension (.csv)
  const wrongExt = await uploadArtifactHandler({
    pathParameters: { attemptId },
    body: { fileName: "sales.csv", contentBase64: Buffer.from("a,b,c").toString("base64") }
  });
  assert.equal(wrongExt.statusCode, 400);
  assert.equal((wrongExt.body as { code: string }).code, "WRONG_EXTENSION");

  // 2. Macro-enabled extension (.xlsm)
  const xlsmExt = await uploadArtifactHandler({
    pathParameters: { attemptId },
    body: { fileName: "sales.xlsm", contentBase64: Buffer.from("PK\x03\x04").toString("base64") }
  });
  assert.equal(xlsmExt.statusCode, 400);
  assert.equal((xlsmExt.body as { code: string }).code, "MACRO_ENABLED");

  // 3. Disguised macro-enabled file (.xlsx containing xl/vbaProject.bin)
  const disguisedMacroZip = buildZipBuffer([
    { name: "[Content_Types].xml", data: Buffer.from("<Types></Types>") },
    { name: "xl/workbook.xml", data: Buffer.from('<workbook><sheets><sheet name="Sales_Data"/><sheet name="Summary"/></sheets></workbook>') },
    { name: "xl/vbaProject.bin", data: Buffer.from("macro-payload") }
  ]);
  const disguisedMacro = await uploadArtifactHandler({
    pathParameters: { attemptId },
    body: { fileName: "sneaky.xlsx", contentBase64: disguisedMacroZip.toString("base64") }
  });
  assert.equal(disguisedMacro.statusCode, 400);
  assert.equal((disguisedMacro.body as { code: string }).code, "MACRO_ENABLED");

  // 4. Oversized file (> 10 MB)
  const oversized = Buffer.alloc(10 * 1024 * 1024 + 100, 0x41);
  const oversizedRes = await uploadArtifactHandler({
    pathParameters: { attemptId },
    body: { fileName: "huge.xlsx", contentBase64: oversized.toString("base64") }
  });
  assert.equal(oversizedRes.statusCode, 400);
  assert.equal((oversizedRes.body as { code: string }).code, "FILE_TOO_LARGE");

  // 5. Malformed ZIP / invalid magic bytes
  const badMagic = await uploadArtifactHandler({
    pathParameters: { attemptId },
    body: { fileName: "fake.xlsx", contentBase64: Buffer.from("not-a-zip-file").toString("base64") }
  });
  assert.equal(badMagic.statusCode, 400);
  assert.equal((badMagic.body as { code: string }).code, "INVALID_MAGIC_BYTES");

  const truncatedZip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00]);
  const malformedZip = await uploadArtifactHandler({
    pathParameters: { attemptId },
    body: { fileName: "corrupt.xlsx", contentBase64: truncatedZip.toString("base64") }
  });
  assert.equal(malformedZip.statusCode, 400);
  assert.equal((malformedZip.body as { code: string }).code, "MALFORMED_ZIP");

  // 6. Missing required sheet (only Sheet1 present)
  const missingSheetXlsx = buildXlsxBuffer([{ name: "Sheet1", rows: [["Hello", 123]] }]);
  const missingSheetRes = await uploadArtifactHandler({
    pathParameters: { attemptId },
    body: { fileName: "missing_sheet.xlsx", contentBase64: missingSheetXlsx.toString("base64") }
  });
  assert.equal(missingSheetRes.statusCode, 400);
  assert.equal((missingSheetRes.body as { code: string }).code, "MISSING_SHEET");
});
