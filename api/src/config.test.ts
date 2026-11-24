import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "./config";

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
