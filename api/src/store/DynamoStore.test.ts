import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { CreateTableCommand, DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoStore } from "./DynamoStore";
import type { Session, SkillRecord } from "../types";

/*
 * These tests require DynamoDB Local running on port 8000.
 *
 *   docker run -d -p 8000:8000 amazon/dynamodb-local
 *
 * If DYNAMODB_LOCAL_ENDPOINT is not set the test file is skipped.
 */

const endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT ?? "";
const shouldRun = endpoint.length > 0;

const sessionsTable = "viva-test-sessions";
const credentialsTable = "viva-test-credentials";

async function createTables(client: DynamoDBClient): Promise<void> {
  await client.send(new CreateTableCommand({
    TableName: sessionsTable,
    KeySchema: [{ AttributeName: "sessionId", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "sessionId", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST"
  }));
  await client.send(new CreateTableCommand({
    TableName: credentialsTable,
    KeySchema: [{ AttributeName: "pageId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "pageId", AttributeType: "S" },
      { AttributeName: "sessionId", AttributeType: "S" }
    ],
    BillingMode: "PAY_PER_REQUEST",
    GlobalSecondaryIndexes: [{
      IndexName: "sessionId-index",
      KeySchema: [{ AttributeName: "sessionId", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" }
    }]
  }));
}

async function deleteTables(client: DynamoDBClient): Promise<void> {
  await client.send(new DeleteTableCommand({ TableName: sessionsTable })).catch(() => {});
  await client.send(new DeleteTableCommand({ TableName: credentialsTable })).catch(() => {});
}

const session = (): Session => ({
  id: "session-1",
  skill: "excel",
  language: "en",
  level: "new",
  status: "active",
  understanding: 0,
  stalled: false,
  startedAt: "2026-11-24T00:00:00.000Z",
  updatedAt: "2026-11-24T00:00:00.000Z",
  voiceMode: "mock",
  criterionStates: [],
  transcript: [],
  meterTrace: [{ turnIndex: 0, value: 0 }]
});

const record = (): SkillRecord => ({
  id: "page-1",
  sessionId: "session-1",
  skill: "excel",
  language: "en",
  rubricVersion: "1.0.0",
  total: 0,
  overallLevel: "Starting",
  scores: [],
  meterTrace: [{ turnIndex: 0, value: 0 }],
  tooShort: false,
  issuedAt: "2026-11-24T00:00:00.000Z"
});

if (shouldRun) {
  let client: DynamoDBClient;
  let store: DynamoStore;

  before(async () => {
    client = new DynamoDBClient({ region: "local", endpoint });
    await deleteTables(client);
    await createTables(client);
    store = new DynamoStore(sessionsTable, credentialsTable, "local", { endpoint });
  });

  after(async () => {
    await deleteTables(client);
    client.destroy();
  });

  test("DynamoStore persists sessions and credentials", async () => {
    const created = session();
    await store.createSession(created);
    assert.deepEqual(await store.getSession(created.id), created);

    const updated = { ...created, understanding: 25, updatedAt: "2026-11-24T00:01:00.000Z" };
    await store.saveSession(updated);
    assert.deepEqual(await store.getSession(updated.id), updated);

    const credential = record();
    await store.saveCredential(credential);
    assert.deepEqual(await store.getCredential(credential.id), credential);
  });

  test("DynamoStore returns undefined for missing items", async () => {
    assert.equal(await store.getSession("nonexistent"), undefined);
    assert.equal(await store.getCredential("nonexistent"), undefined);
  });

  test("DynamoStore queries credential by sessionId via GSI", async () => {
    const credential = record();
    await store.saveCredential(credential);
    const found = await store.getCredentialBySessionId(credential.sessionId);
    assert.equal(found?.id, credential.id);

    const missing = await store.getCredentialBySessionId("no-such-session");
    assert.equal(missing, undefined);
  });
} else {
  test("DynamoStore tests skipped (set DYNAMODB_LOCAL_ENDPOINT to run)", { skip: true }, () => {});
}
