import assert from "node:assert/strict";
import test from "node:test";
import { getIntegrationsStatus, loadConfig } from "./config";

test("uses mock mode without cloud configuration", () => {
  const config = loadConfig({ MOCK_MODE: "1" });
  assert.equal(config.mockMode, true);
  assert.equal(config.localDataDirectory, ".data");
});

test("fails fast when cloud table configuration is incomplete", () => {
  assert.throws(() => loadConfig({ MOCK_MODE: "0" }), /AWS_REGION/);
  assert.throws(() => loadConfig({ MOCK_MODE: "0", AWS_REGION: "ap-south-1" }), /AWS_SESSIONS_TABLE/);
  assert.throws(() => loadConfig({ MOCK_MODE: "0", AWS_REGION: "ap-south-1", AWS_SESSIONS_TABLE: "sessions", AWS_CREDENTIALS_TABLE: "credentials" }), /AWS_S3_BUCKET/);
  assert.throws(() => loadConfig({ MOCK_MODE: "0", AWS_REGION: "ap-south-1", AWS_SESSIONS_TABLE: "sessions", AWS_CREDENTIALS_TABLE: "credentials", AWS_S3_BUCKET: "bucket" }), /BEDROCK_MODEL_ID/);
  assert.throws(() => loadConfig({ MOCK_MODE: "0", AWS_REGION: "ap-south-1", AWS_SESSIONS_TABLE: "sessions", AWS_CREDENTIALS_TABLE: "credentials", AWS_S3_BUCKET: "bucket", BEDROCK_MODEL_ID: "model" }), /PAGE_SECRET/);
  assert.throws(() => loadConfig({ MOCK_MODE: "0", AWS_REGION: "ap-south-1", AWS_SESSIONS_TABLE: "sessions", AWS_CREDENTIALS_TABLE: "credentials", AWS_S3_BUCKET: "bucket", BEDROCK_MODEL_ID: "model", PAGE_SECRET: "secret" }), /ELEVENLABS_API_KEY/);
});

test("getIntegrationsStatus accurately reports Mock, Link only, Not configured, Configured, and Planned states", () => {
  const mockCfg = loadConfig({ MOCK_MODE: "1" });
  const mockItems = getIntegrationsStatus(mockCfg);
  assert.equal(mockItems.find((i) => i.id === "elevenlabs")?.status, "Mock");
  assert.equal(mockItems.find((i) => i.id === "aws_runtime")?.status, "Mock");
  assert.equal(mockItems.find((i) => i.id === "xyz_domain")?.status, "Not configured");
  assert.equal(mockItems.find((i) => i.id === "tryb")?.status, "Not configured");
  assert.equal(mockItems.find((i) => i.id === "devnovate")?.status, "Not configured");
  assert.equal(mockItems.find((i) => i.id === "aws_cognito_sqs")?.status, "Planned");
  assert.match(mockItems.find((i) => i.id === "aws_sbg")?.note ?? "", /not a runtime API/i);

  const linkCfg = loadConfig({
    MOCK_MODE: "1",
    VITE_TRYB_PRACTICE_URL: "https://tryb.example.test",
    VITE_DEVNOVATE_URL: "https://devnovate.example.test",
    PASSPORT_PUBLIC_DOMAIN: "prooffolio.xyz"
  });
  const linkItems = getIntegrationsStatus(linkCfg);
  assert.equal(linkItems.find((i) => i.id === "tryb")?.status, "Link only");
  assert.equal(linkItems.find((i) => i.id === "devnovate")?.status, "Link only");
  assert.equal(linkItems.find((i) => i.id === "xyz_domain")?.status, "Configured");
});
