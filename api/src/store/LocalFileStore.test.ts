import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFileStore } from "./LocalFileStore";
import type { Session, SkillRecord } from "../types";

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

test("LocalFileStore persists sessions and credentials", async () => {
  const directory = await mkdtemp(join(tmpdir(), "viva-store-"));
  try {
    const store = new LocalFileStore(directory);
    const created = session();
    await store.createSession(created);
    assert.deepEqual(await store.getSession(created.id), created);

    const updated = { ...created, understanding: 25, updatedAt: "2026-11-24T00:01:00.000Z" };
    await store.saveSession(updated);
    assert.deepEqual(await store.getSession(updated.id), updated);

    const credential = record();
    await store.saveCredential(credential);
    assert.deepEqual(await store.getCredential(credential.id), credential);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
