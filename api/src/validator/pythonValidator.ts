import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import type { ExpectedRetailOutputs } from "../challenge/datasetGenerator";

const execFileAsync = promisify(execFile);

export const checkStatusSchema = z.enum(["pass", "fail", "unknown", "not_applicable"]);

export const factSheetSchema = z.object({
  attemptId: z.string().min(1),
  artifactId: z.string().min(1),
  validatorVersion: z.string().min(1),
  fileHash: z.string().length(64),
  status: z.enum(["ok", "review_required", "parse_error"]),
  practicalScore: z.number().min(0).max(100),
  workbookStructure: z.object({
    sheetNames: z.array(z.string()),
    expectedSheetsPresent: z.boolean(),
    salesDataHeaders: z.array(z.string()),
    expectedHeadersMatch: z.boolean()
  }),
  checkResults: z.array(
    z.object({
      checkId: z.string(),
      name: z.string(),
      status: checkStatusSchema,
      critical: z.boolean(),
      score: z.number(),
      maxScore: z.number(),
      sourceRef: z.string(),
      explanation: z.string(),
      actionableHint: z.string().nullable().optional()
    })
  ),
  factIds: z.array(z.string()),
  formulaFacts: z.array(
    z.object({
      factId: z.string(),
      metric: z.string(),
      sourceRef: z.string(),
      formula: z.string().nullable().optional(),
      supported: z.boolean(),
      cachedValue: z.number().nullable().optional(),
      expectedValue: z.number().nullable().optional(),
      status: checkStatusSchema
    })
  ),
  rowCounts: z.record(z.number()),
  duplicateCounts: z.record(z.number()),
  expectedVsActualTotals: z.object({
    expectedTotalRevenue: z.number().nullable().optional(),
    actualTotalRevenue: z.number().nullable().optional(),
    expectedAverageOrder: z.number().nullable().optional(),
    actualAverageOrder: z.number().nullable().optional(),
    expectedUniqueOrders: z.number().nullable().optional(),
    actualUniqueOrders: z.number().nullable().optional()
  }),
  qualitativeObservations: z.array(
    z.object({
      factId: z.string(),
      sourceRef: z.string(),
      message: z.string()
    })
  ),
  warnings: z.array(z.string()),
  errors: z.array(z.string())
});

export type FactSheet = z.infer<typeof factSheetSchema>;

function resolveValidatorDir(): string {
  const local = resolve(process.cwd(), "validator");
  if (existsSync(local)) return local;
  return resolve(process.cwd(), "..", "validator");
}

export async function runPythonValidator(options: {
  filePath: string;
  attemptId: string;
  artifactId: string;
  expectedOutputs?: ExpectedRetailOutputs;
  timeoutMs?: number;
}): Promise<FactSheet> {
  const validatorDir = resolveValidatorDir();
  const pythonBin = process.env.PYTHON_BIN ?? "python";
  const timeout = options.timeoutMs ?? 15_000;

  let expectedFilePath: string | undefined;
  const args = [
    "-m",
    "prooffolio_validator.cli",
    "--file",
    options.filePath,
    "--attempt-id",
    options.attemptId,
    "--artifact-id",
    options.artifactId
  ];

  try {
    if (options.expectedOutputs) {
      expectedFilePath = join(tmpdir(), `prooffolio-expected-${Date.now()}.json`);
      await writeFile(expectedFilePath, JSON.stringify(options.expectedOutputs), "utf8");
      args.push("--expected", expectedFilePath);
    }

    const { stdout } = await execFileAsync(pythonBin, args, {
      timeout,
      maxBuffer: 2 * 1024 * 1024,
      env: {
        ...process.env,
        PYTHONPATH: validatorDir
      }
    });

    const parsedJson = JSON.parse(stdout) as unknown;
    return factSheetSchema.parse(parsedJson);
  } finally {
    if (expectedFilePath) {
      await rm(expectedFilePath, { force: true }).catch(() => {});
    }
  }
}
