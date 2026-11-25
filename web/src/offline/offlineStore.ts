export type EligibleOfflineActionType =
  | "lesson_completed"
  | "practice_drill_answered"
  | "external_link_opened";

export type OfflineSyncStatus = "pending" | "synced" | "failed";

export interface OfflineAction {
  id: string;
  idempotencyKey: string;
  type: EligibleOfflineActionType;
  payload: Record<string, unknown>;
  clientUpdatedAt: string;
  status: OfflineSyncStatus;
  attempts: number;
  lastError?: string;
  skippedNewerServer?: boolean;
}

export interface PracticeAnswerRecord {
  selectedOptionId: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface ExternalLinkOpenRecord {
  url: string;
  openedAt: string;
}

export interface OfflineProgressState {
  completedLessonIds: string[];
  practiceAnswers: Record<string, PracticeAnswerRecord>;
  externalLinksOpened: ExternalLinkOpenRecord[];
  syncQueue: OfflineAction[];
}

export interface SyncSummary {
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  overallStatus: "idle" | "pending" | "synced" | "failed";
}

export type SyncSender = (action: OfflineAction) => Promise<void>;

const DB_NAME = "prooffolio-offline-db";
const STORE_NAME = "offline_state";
const STATE_KEY = "learner_progress_v1";
const LOCAL_STORAGE_KEY = "prooffolio_offline_progress_v1";

export function emptyOfflineState(): OfflineProgressState {
  return {
    completedLessonIds: [],
    practiceAnswers: {},
    externalLinksOpened: [],
    syncQueue: []
  };
}

export function computeSyncSummary(queue: OfflineAction[]): SyncSummary {
  const pendingCount = queue.filter((a) => a.status === "pending").length;
  const failedCount = queue.filter((a) => a.status === "failed").length;
  const syncedCount = queue.filter((a) => a.status === "synced").length;

  let overallStatus: SyncSummary["overallStatus"] = "idle";
  if (failedCount > 0) overallStatus = "failed";
  else if (pendingCount > 0) overallStatus = "pending";
  else if (syncedCount > 0) overallStatus = "synced";

  return { pendingCount, syncedCount, failedCount, overallStatus };
}

export class OfflinePersistenceStore {
  private memoryFallback: OfflineProgressState | null = null;

  async load(): Promise<OfflineProgressState> {
    if (typeof indexedDB !== "undefined") {
      try {
        const fromIdb = await this.readIndexedDB();
        if (fromIdb) return fromIdb;
      } catch {
        // Fallback to localStorage / memory if IndexedDB is blocked
      }
    }
    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) return JSON.parse(raw) as OfflineProgressState;
      } catch {
        // Ignore storage errors
      }
    }
    return this.memoryFallback ? structuredClone(this.memoryFallback) : emptyOfflineState();
  }

  async save(state: OfflineProgressState): Promise<void> {
    this.memoryFallback = structuredClone(state);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage quota errors
      }
    }
    if (typeof indexedDB !== "undefined") {
      try {
        await this.writeIndexedDB(state);
      } catch {
        // Non-blocking fallback
      }
    }
  }

  async markLessonCompleted(lessonId: string, now = new Date().toISOString()): Promise<OfflineProgressState> {
    const state = await this.load();
    if (!state.completedLessonIds.includes(lessonId)) {
      state.completedLessonIds.push(lessonId);
    }
    this.enqueueInternal(state, "lesson_completed", { lessonId }, `lesson:${lessonId}`, now);
    await this.save(state);
    return state;
  }

  async recordPracticeAnswer(
    drillId: string,
    selectedOptionId: string,
    isCorrect: boolean,
    now = new Date().toISOString()
  ): Promise<OfflineProgressState> {
    const state = await this.load();
    state.practiceAnswers[drillId] = { selectedOptionId, isCorrect, answeredAt: now };
    this.enqueueInternal(
      state,
      "practice_drill_answered",
      { drillId, selectedOptionId, isCorrect },
      `drill:${drillId}:${selectedOptionId}`,
      now
    );
    await this.save(state);
    return state;
  }

  async recordExternalLinkOpened(url: string, now = new Date().toISOString()): Promise<OfflineProgressState> {
    const state = await this.load();
    state.externalLinksOpened.push({ url, openedAt: now });
    this.enqueueInternal(
      state,
      "external_link_opened",
      { url, openedAt: now },
      `external_open:${url}:${now}`,
      now
    );
    await this.save(state);
    return state;
  }

  enqueueInternal(
    state: OfflineProgressState,
    type: EligibleOfflineActionType,
    payload: Record<string, unknown>,
    idempotencyKey: string,
    clientUpdatedAt = new Date().toISOString()
  ): OfflineAction {
    const existing = state.syncQueue.find((a) => a.idempotencyKey === idempotencyKey);
    if (existing) {
      return existing;
    }
    const action: OfflineAction = {
      id: `act_${state.syncQueue.length + 1}_${Date.now()}`,
      idempotencyKey,
      type,
      payload,
      clientUpdatedAt,
      status: "pending",
      attempts: 0
    };
    state.syncQueue.push(action);
    return action;
  }

  async syncPendingActions(
    sender: SyncSender,
    serverTimestamps: Record<string, string> = {}
  ): Promise<OfflineProgressState> {
    const state = await this.load();
    const syncedKeys = new Set(
      state.syncQueue.filter((a) => a.status === "synced").map((a) => a.idempotencyKey)
    );

    for (const action of state.syncQueue) {
      if (action.status === "synced") continue;

      // Duplicate sync prevention via idempotency key
      if (syncedKeys.has(action.idempotencyKey)) {
        action.status = "synced";
        continue;
      }

      // Never silently overwrite newer server state
      const serverUpdatedAt = serverTimestamps[action.idempotencyKey];
      if (serverUpdatedAt && Date.parse(serverUpdatedAt) > Date.parse(action.clientUpdatedAt)) {
        action.status = "synced";
        action.skippedNewerServer = true;
        syncedKeys.add(action.idempotencyKey);
        continue;
      }

      action.attempts += 1;
      try {
        await sender(action);
        action.status = "synced";
        action.lastError = undefined;
        syncedKeys.add(action.idempotencyKey);
      } catch (err: unknown) {
        action.status = "failed";
        action.lastError = err instanceof Error ? err.message : "Sync failed";
      }
    }

    await this.save(state);
    return state;
  }

  private readIndexedDB(): Promise<OfflineProgressState | undefined> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(STORE_NAME, "readonly");
        const getReq = tx.objectStore(STORE_NAME).get(STATE_KEY);
        getReq.onsuccess = () => {
          db.close();
          resolve(getReq.result as OfflineProgressState | undefined);
        };
        getReq.onerror = () => {
          db.close();
          reject(getReq.error);
        };
      };
      req.onerror = () => reject(req.error);
    });
  }

  private writeIndexedDB(state: OfflineProgressState): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(state, STATE_KEY);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const defaultOfflineStore = new OfflinePersistenceStore();

export async function defaultMockSyncSender(_action: OfflineAction): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("Device is offline");
  }
  // In MOCK_MODE=1 or when no dedicated sync endpoint exists yet, local acknowledgment succeeds cleanly
  return Promise.resolve();
}
