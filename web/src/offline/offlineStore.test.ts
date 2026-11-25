import assert from "node:assert/strict";
import test from "node:test";
import { computeSyncSummary, OfflinePersistenceStore, type OfflineAction } from "./offlineStore";

test("OfflinePersistenceStore queues eligible actions and persists progress locally", async () => {
  const store = new OfflinePersistenceStore();

  const afterLesson = await store.markLessonCompleted("lesson-rows-columns", "2026-11-25T00:00:00.000Z");
  assert.deepEqual(afterLesson.completedLessonIds, ["lesson-rows-columns"]);
  assert.equal(afterLesson.syncQueue.length, 1);
  assert.equal(afterLesson.syncQueue[0].status, "pending");

  const afterDrill = await store.recordPracticeAnswer(
    "drill-duplicate-row",
    "b",
    true,
    "2026-11-25T00:01:00.000Z"
  );
  assert.equal(afterDrill.practiceAnswers["drill-duplicate-row"].isCorrect, true);
  assert.equal(afterDrill.syncQueue.length, 2);

  const summary = computeSyncSummary(afterDrill.syncQueue);
  assert.equal(summary.pendingCount, 2);
  assert.equal(summary.overallStatus, "pending");
});

test("OfflinePersistenceStore prevents duplicate queuing and duplicate syncs via idempotency keys", async () => {
  const store = new OfflinePersistenceStore();

  await store.markLessonCompleted("lesson-formulas", "2026-11-25T00:00:00.000Z");
  // Mark same lesson again -> must not create duplicate queue item
  const state = await store.markLessonCompleted("lesson-formulas", "2026-11-25T00:05:00.000Z");
  assert.equal(state.syncQueue.length, 1);

  const sentIds: string[] = [];
  const syncedState = await store.syncPendingActions(async (action: OfflineAction) => {
    sentIds.push(action.idempotencyKey);
  });
  assert.deepEqual(sentIds, ["lesson:lesson-formulas"]);
  assert.equal(computeSyncSummary(syncedState.syncQueue).overallStatus, "synced");

  // Running sync again must not re-send already synced items
  await store.syncPendingActions(async (action: OfflineAction) => {
    sentIds.push(action.idempotencyKey);
  });
  assert.equal(sentIds.length, 1);
});

test("OfflinePersistenceStore handles failed sync and retry on reconnection", async () => {
  const store = new OfflinePersistenceStore();
  await store.recordExternalLinkOpened("https://example-tryb.test/drill", "2026-11-25T00:00:00.000Z");

  // First attempt fails (offline/network drop)
  const failedState = await store.syncPendingActions(async () => {
    throw new Error("Network timeout");
  });
  assert.equal(failedState.syncQueue[0].status, "failed");
  assert.equal(failedState.syncQueue[0].attempts, 1);
  assert.equal(computeSyncSummary(failedState.syncQueue).overallStatus, "failed");

  // Retry succeeds when network returns
  const retriedState = await store.syncPendingActions(async () => {
    return Promise.resolve();
  });
  assert.equal(retriedState.syncQueue[0].status, "synced");
  assert.equal(retriedState.syncQueue[0].attempts, 2);
  assert.equal(computeSyncSummary(retriedState.syncQueue).overallStatus, "synced");
});

test("OfflinePersistenceStore never silently overwrites newer server state", async () => {
  const store = new OfflinePersistenceStore();
  await store.markLessonCompleted("lesson-dates-currency", "2026-11-25T00:00:00.000Z");

  let senderCalled = false;
  const result = await store.syncPendingActions(
    async () => {
      senderCalled = true;
    },
    {
      "lesson:lesson-dates-currency": "2026-11-25T00:10:00.000Z" // newer than clientUpdatedAt
    }
  );

  assert.equal(senderCalled, false);
  assert.equal(result.syncQueue[0].status, "synced");
  assert.equal(result.syncQueue[0].skippedNewerServer, true);
});
