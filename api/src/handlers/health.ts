import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config";
import { getStore } from "../store/createStore";
import type { HttpEvent, HttpResponse } from "../types";

const execFileAsync = promisify(execFile);

export type HealthServiceState = "Live" | "Mock" | "Unavailable" | "Not configured";

export interface ServiceHealth {
  name: string;
  status: "ok" | "mock" | "error";
  displayState: HealthServiceState;
  message: string;
}

export interface HealthReport {
  status: "ok" | "degraded" | "error";
  mockMode: boolean;
  timestamp: string;
  services: {
    elevenLabs: ServiceHealth;
    bedrock: ServiceHealth;
    store: ServiceHealth;
    validator: ServiceHealth;
    awsPersistence: ServiceHealth;
    domain: ServiceHealth;
  };
}

export async function getHealthHandler(_event?: HttpEvent): Promise<HttpResponse<HealthReport>> {
  // 1. ElevenLabs
  let elevenLabs: ServiceHealth;
  if (config.mockMode) {
    elevenLabs = {
      name: "ElevenLabs Voice AI",
      status: "mock",
      displayState: "Mock",
      message: "Scripted local voice/text simulator active (MOCK_MODE=1)"
    };
  } else if (config.elevenLabsApiKey && config.elevenLabsAgentId) {
    elevenLabs = {
      name: "ElevenLabs Voice AI",
      status: "ok",
      displayState: "Live",
      message: `Configured (Agent: ${config.elevenLabsAgentId.slice(0, 8)}…)`
    };
  } else {
    elevenLabs = {
      name: "ElevenLabs Voice AI",
      status: "error",
      displayState: "Not configured",
      message: "Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID"
    };
  }

  // 2. Amazon Bedrock
  let bedrock: ServiceHealth;
  if (config.mockMode) {
    bedrock = {
      name: "Amazon Bedrock",
      status: "mock",
      displayState: "Mock",
      message: "Deterministic mock scorer active (MOCK_MODE=1)"
    };
  } else if (config.bedrockModelId && config.awsRegion) {
    bedrock = {
      name: "Amazon Bedrock",
      status: "ok",
      displayState: "Live",
      message: `Configured (${config.bedrockModelId} in ${config.awsRegion})`
    };
  } else {
    bedrock = {
      name: "Amazon Bedrock",
      status: "error",
      displayState: "Not configured",
      message: "Missing BEDROCK_MODEL_ID or AWS_REGION"
    };
  }

  // 3. Local / Active Store
  let storeHealth: ServiceHealth;
  try {
    const store = getStore();
    const sessions = await store.listSessions();
    storeHealth = {
      name: config.mockMode ? "LocalFileStore" : "DynamoStore",
      status: config.mockMode ? "mock" : "ok",
      displayState: config.mockMode ? "Mock" : "Live",
      message: `Connected (${sessions.length} legacy sessions in store)`
    };
  } catch (error) {
    storeHealth = {
      name: config.mockMode ? "LocalFileStore" : "DynamoStore",
      status: "error",
      displayState: "Unavailable",
      message: error instanceof Error ? error.message : "Store unreachable"
    };
  }

  // 4. Python Deterministic Validator
  let validatorHealth: ServiceHealth;
  try {
    const pythonBin = process.env.PYTHON_BIN ?? "python";
    await execFileAsync(pythonBin, ["-c", "import openpyxl, pandas, pydantic"], { timeout: 4000 });
    validatorHealth = {
      name: "Python Validator (openpyxl + pandas)",
      status: "ok",
      displayState: "Live",
      message: "Local Python deterministic validator ready"
    };
  } catch {
    validatorHealth = {
      name: "Python Validator (openpyxl + pandas)",
      status: "error",
      displayState: "Unavailable",
      message: "Python validator dependencies not found on PATH"
    };
  }

  // 5. AWS Persistence (DynamoDB + S3)
  const awsPersistence: ServiceHealth = config.mockMode
    ? {
        name: "AWS Persistence (DynamoDB / S3)",
        status: "mock",
        displayState: "Mock",
        message: "Using local .data/store.json and .data/uploads/ (MOCK_MODE=1)"
      }
    : config.sessionsTable && config.s3Bucket
    ? {
        name: "AWS Persistence (DynamoDB / S3)",
        status: "ok",
        displayState: "Live",
        message: `Configured (${config.sessionsTable}, ${config.s3Bucket})`
      }
    : {
        name: "AWS Persistence (DynamoDB / S3)",
        status: "error",
        displayState: "Not configured",
        message: "AWS tables or S3 bucket not configured"
      };

  // 6. .xyz Public Domain
  const domainHealth: ServiceHealth = config.passportPublicDomain
    ? {
        name: ".xyz Public Passport Domain",
        status: "ok",
        displayState: "Live",
        message: `Configured (${config.passportPublicDomain})`
      }
    : {
        name: ".xyz Public Passport Domain",
        status: "mock",
        displayState: "Not configured",
        message: "Domain not configured (using local development URL)"
      };

  const isDegraded = elevenLabs.status === "error" || bedrock.status === "error" || validatorHealth.status === "error";
  const isDown = storeHealth.status === "error";
  const overallStatus: HealthReport["status"] = isDown ? "error" : isDegraded ? "degraded" : "ok";

  return {
    statusCode: isDown ? 503 : 200,
    body: {
      status: overallStatus,
      mockMode: config.mockMode,
      timestamp: new Date().toISOString(),
      services: {
        elevenLabs,
        bedrock,
        store: storeHealth,
        validator: validatorHealth,
        awsPersistence,
        domain: domainHealth
      }
    }
  };
}
