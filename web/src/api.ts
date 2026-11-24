import type { AgentLevel, CriterionState, Language, Session, SkillRecord, SkillSummary, Speaker, VoiceMode } from "./types";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init
  });
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The request could not be completed.");
  return body;
}

export interface VoiceConnection {
  mode: VoiceMode;
  signedUrl?: string;
  dynamicVariables: Record<string, string>;
  languageOverride: Language;
}

export interface StartedSession {
  session: Session;
  voice: VoiceConnection;
  agentText?: string;
}

export interface PublicConfig {
  mockMode: boolean;
  maxSessionDurationSeconds: number;
}

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

export function getHealth(): Promise<HealthReport> {
  return request("/api/health");
}

export function startSession(skill: string, language: Language, level: AgentLevel): Promise<StartedSession> {
  return request("/api/session/start", { method: "POST", body: JSON.stringify({ skill, language, level }) });
}

export function getSkills(): Promise<SkillSummary[]> {
  return request("/api/skills");
}

export function getConfig(): Promise<PublicConfig> {
  return request("/api/config");
}

export function sendTurn(id: string, text: string, speaker: Speaker = "candidate"): Promise<{ session: Session; agentText?: string; understanding: number; stalled: boolean; criterionStates: CriterionState[]; nextProbeCriterionId: string }> {
  return request(`/api/session/${id}/turn`, { method: "POST", body: JSON.stringify({ text, speaker }) });
}

export function finishSession(id: string): Promise<SkillRecord> {
  return request(`/api/session/${id}/finish`, { method: "POST" });
}

export async function getSkillRecord(id: string): Promise<SkillRecord> {
  const response = await request<{ session: Session; record?: SkillRecord }>(`/api/session/${id}`);
  if (!response.record) throw new Error("This session does not have a record yet.");
  return response.record;
}

export function createCredential(sessionId: string, name?: string): Promise<{ pageId: string }> {
  return request("/api/session/" + sessionId + "/credential", { method: "POST", body: JSON.stringify({ name }) });
}

export function getCredential(pageId: string): Promise<SkillRecord> {
  return request("/api/credential/" + pageId);
}

export function shareCredential(pageId: string): Promise<{ shared: boolean }> {
  return request("/api/credential/" + pageId + "/share", { method: "PATCH" });
}

export function deleteCredential(pageId: string): Promise<{ deleted: boolean }> {
  return request("/api/credential/" + pageId, { method: "DELETE" });
}
