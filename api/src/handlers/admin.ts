import { config } from "../config";
import { getStore } from "../store/createStore";
import type { CostTracker, HttpEvent, HttpResponse } from "../types";

interface SessionCostSummary {
  sessionId: string;
  skill: string;
  language: string;
  voiceMode: string;
  durationSeconds: number;
  costTracker: CostTracker;
}

interface CostsResponse {
  sessionCount: number;
  averageCostInr: number;
  totalCostInr: number;
  sessions: SessionCostSummary[];
}

export async function getAdminCostsHandler(event: HttpEvent): Promise<HttpResponse<CostsResponse | { error: string }>> {
  const key = event.headers?.["x-admin-key"] ?? event.headers?.["X-Admin-Key"];
  if (!key || key !== config.adminKey) {
    return { statusCode: 401, body: { error: "Invalid or missing ADMIN_KEY." } };
  }

  const sessions = await getStore().listSessions();
  const completed = sessions.filter((s) => s.status === "complete" && s.costTracker);

  const summaries: SessionCostSummary[] = completed.map((s) => {
    const start = Date.parse(s.startedAt);
    const end = s.completedAt ? Date.parse(s.completedAt) : Date.parse(s.updatedAt);
    return {
      sessionId: s.id,
      skill: s.skill,
      language: s.language,
      voiceMode: s.voiceMode,
      durationSeconds: Math.max(0, (end - start) / 1000),
      costTracker: s.costTracker!
    };
  });

  const totalCostInr = summaries.reduce((sum, s) => sum + s.costTracker.estimatedCostInr, 0);
  const averageCostInr = summaries.length > 0
    ? Math.round((totalCostInr / summaries.length) * 10000) / 10000
    : 0;

  return {
    statusCode: 200,
    body: {
      sessionCount: summaries.length,
      averageCostInr,
      totalCostInr: Math.round(totalCostInr * 10000) / 10000,
      sessions: summaries
    }
  };
}
