import { config } from "../config";
import { getStore } from "../store/createStore";
import type { HttpEvent, HttpResponse } from "../types";

export interface ServiceHealth {
  name: string;
  status: "ok" | "mock" | "error";
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
  };
}

export async function getHealthHandler(_event?: HttpEvent): Promise<HttpResponse<HealthReport>> {
  // Check ElevenLabs
  let elevenLabs: ServiceHealth;
  if (config.mockMode) {
    elevenLabs = {
      name: "ElevenLabs",
      status: "mock",
      message: "Mock voice agent active (MOCK_MODE=1)"
    };
  } else if (config.elevenLabsApiKey && config.elevenLabsAgentId) {
    elevenLabs = {
      name: "ElevenLabs",
      status: "ok",
      message: `Configured (Agent: ${config.elevenLabsAgentId.slice(0, 8)}…)`
    };
  } else {
    elevenLabs = {
      name: "ElevenLabs",
      status: "error",
      message: "Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID"
    };
  }

  // Check Bedrock
  let bedrock: ServiceHealth;
  if (config.mockMode) {
    bedrock = {
      name: "Amazon Bedrock",
      status: "mock",
      message: "Mock scorer active (MOCK_MODE=1)"
    };
  } else if (config.bedrockModelId && config.awsRegion) {
    bedrock = {
      name: "Amazon Bedrock",
      status: "ok",
      message: `Configured (${config.bedrockModelId} in ${config.awsRegion})`
    };
  } else {
    bedrock = {
      name: "Amazon Bedrock",
      status: "error",
      message: "Missing BEDROCK_MODEL_ID or AWS_REGION"
    };
  }

  // Check Store
  let storeHealth: ServiceHealth;
  try {
    const store = getStore();
    const sessions = await store.listSessions();
    storeHealth = {
      name: config.mockMode ? "LocalFileStore" : "DynamoStore",
      status: "ok",
      message: `Connected (${sessions.length} sessions in database)`
    };
  } catch (error) {
    storeHealth = {
      name: config.mockMode ? "LocalFileStore" : "DynamoStore",
      status: "error",
      message: error instanceof Error ? error.message : "Store unreachable"
    };
  }

  const isDegraded = elevenLabs.status === "error" || bedrock.status === "error";
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
        store: storeHealth
      }
    }
  };
}
