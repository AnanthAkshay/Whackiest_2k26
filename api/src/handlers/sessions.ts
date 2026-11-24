import { randomUUID } from "node:crypto";
import { z } from "zod";
import { logError, logInfo } from "../logger";
import { estimateCostInr } from "../pricing";
import { nextMockPrompt, openingPrompt } from "../services/mockAgent";
import { loadSkillRubric, type SkillRubric } from "../rubric";
import { createScorer } from "../scorer/createScorer";
import { initialCriterionStates, meterForCriterionStates, nextProbeFromStates } from "../scorer/criterionState";
import { getStore } from "../store/createStore";
import { createDynamicVariables, createVoiceConnection, type VoiceConnection } from "../voice/ElevenLabsAgent";
import type { CostTracker, HttpEvent, HttpResponse, MeterTraceEntry, Session, SkillRecord, Speaker } from "../types";

const startSessionSchema = z.object({
  skill: z.string().min(1).max(80),
  language: z.enum(["en", "hi", "kn"]),
  level: z.enum(["new", "some", "tough"])
});
const turnSchema = z.object({
  text: z.string().trim().min(1).max(8000),
  speaker: z.enum(["candidate", "agent"]).default("candidate")
});

const notFound = <T>(message: string): HttpResponse<T | { error: string }> => ({ statusCode: 404, body: { error: message } });
const invalidRequest = <T>(message: string): HttpResponse<T | { error: string }> => ({ statusCode: 400, body: { error: message } });

function emptyCostTracker(): CostTracker {
  return { elevenLabsSeconds: 0, bedrockInputTokens: 0, bedrockOutputTokens: 0, estimatedCostInr: 0 };
}

function elapsedSeconds(session: Session): number {
  const start = Date.parse(session.startedAt);
  const end = Date.parse(session.updatedAt);
  return Math.max(0, (end - start) / 1000);
}

function updateCostTracker(session: Session, bedrockInputTokens: number, bedrockOutputTokens: number): CostTracker {
  const tracker = session.costTracker ?? emptyCostTracker();
  const updated: Omit<CostTracker, "estimatedCostInr"> = {
    elevenLabsSeconds: session.voiceMode === "elevenlabs" ? elapsedSeconds(session) : 0,
    bedrockInputTokens: tracker.bedrockInputTokens + bedrockInputTokens,
    bedrockOutputTokens: tracker.bedrockOutputTokens + bedrockOutputTokens
  };
  return { ...updated, estimatedCostInr: estimateCostInr(updated) };
}

export interface StartSessionResponse {
  session: Session;
  voice: VoiceConnection;
  agentText?: string;
}

export async function startSessionHandler(event: HttpEvent<unknown>): Promise<HttpResponse<StartSessionResponse | { error: string }>> {
  const parsed = startSessionSchema.safeParse(event.body);
  if (!parsed.success) return invalidRequest("Session start requires a skill, supported language, and level.");
  const { skill, language, level } = parsed.data;
  let rubric: SkillRubric;
  try {
    rubric = await loadSkillRubric(skill);
  } catch {
    return notFound("The requested skill was not found.");
  }
  let voice: VoiceConnection;
  try {
    voice = await createVoiceConnection(skill, language, level, rubric);
  } catch (error) {
    logError("session.voice_connection_failed", error, { skill, language, agentLevel: level });
    voice = {
      mode: "elevenlabs",
      dynamicVariables: createDynamicVariables(skill, level, language, rubric),
      languageOverride: language
    };
  }
  const now = new Date().toISOString();
  const agentText = voice.mode === "mock" ? openingPrompt(language) : undefined;
  const session: Session = {
    id: randomUUID(),
    skill,
    language,
    level,
    status: "active",
    understanding: 0,
    stalled: false,
    startedAt: now,
    updatedAt: now,
    voiceMode: voice.mode,
    mockQuestionIndex: voice.mode === "mock" ? 0 : undefined,
    transcript: agentText ? [{ speaker: "agent", text: agentText, createdAt: now }] : [],
    criterionStates: initialCriterionStates(rubric),
    nextProbeCriterionId: nextProbeFromStates(rubric, initialCriterionStates(rubric)),
    meterTrace: [{ turnIndex: 0, value: 0 }],
    costTracker: emptyCostTracker()
  };
  await getStore().createSession(session);
  logInfo("session.started", { sessionId: session.id, skill, language, agentLevel: level, voiceMode: voice.mode });
  return { statusCode: 201, body: { session, voice, agentText } };
}

export async function addTurnHandler(event: HttpEvent<unknown>): Promise<HttpResponse<{ session: Session; agentText?: string; understanding: number; stalled: boolean; coveredCriterionIds: string[]; criterionStates: Session["criterionStates"]; nextProbeCriterionId: string } | { error: string }>> {
  const id = event.pathParameters?.id;
  if (!id) return notFound("Session was not found.");
  const session = await getStore().getSession(id);
  if (!session) return notFound("Session was not found.");
  if (session.status !== "active") return invalidRequest("This session has already ended.");
  const parsed = turnSchema.safeParse(event.body);
  if (!parsed.success) return invalidRequest("A non-empty transcript is required.");
  const { text, speaker } = parsed.data;
  const rubric = await loadSkillRubric(session.skill);
  const now = new Date().toISOString();
  let agentText: string | undefined;
  let mockQuestionIndex = session.mockQuestionIndex;
  const newTurns: Session["transcript"] = [{ speaker: speaker as Speaker, text, createdAt: now }];
  if (session.voiceMode === "mock" && speaker === "candidate") {
    mockQuestionIndex = (session.mockQuestionIndex ?? 0) + 1;
    agentText = nextMockPrompt(session.language, mockQuestionIndex);
    newTurns.push({ speaker: "agent", text: agentText, createdAt: now });
  }
  const withTurn: Session = {
    ...session,
    updatedAt: now,
    mockQuestionIndex,
    transcript: [...session.transcript, ...newTurns],
    criterionStates: session.criterionStates ?? initialCriterionStates(rubric),
    nextProbeCriterionId: session.nextProbeCriterionId ?? nextProbeFromStates(rubric, session.criterionStates ?? initialCriterionStates(rubric)),
    meterTrace: session.meterTrace ?? [{ turnIndex: 0, value: 0 }]
  };
  const currentNextProbeCriterionId = withTurn.nextProbeCriterionId ?? nextProbeFromStates(rubric, withTurn.criterionStates);
  const candidateTurnIndex = withTurn.transcript.filter((t) => t.speaker === "candidate").length;
  const evaluation = speaker === "candidate"
    ? await createScorer().evaluateTurn(withTurn, rubric)
    : {
      understanding: withTurn.understanding || meterForCriterionStates(rubric, withTurn.criterionStates),
      stalled: withTurn.stalled ?? false,
      coveredCriterionIds: withTurn.criterionStates.filter((state) => state.status === "partial" || state.status === "correct").map((state) => state.criterionId),
      criterionStates: withTurn.criterionStates,
      nextProbeCriterionId: currentNextProbeCriterionId,
      tokenUsage: undefined
    };
  const traceEntry: MeterTraceEntry = { turnIndex: candidateTurnIndex, value: evaluation.understanding };
  const nextMeterTrace = speaker === "candidate"
    ? [...withTurn.meterTrace, traceEntry]
    : withTurn.meterTrace;

  const costTracker = updateCostTracker(
    withTurn,
    evaluation.tokenUsage?.inputTokens ?? 0,
    evaluation.tokenUsage?.outputTokens ?? 0
  );

  const nextSession: Session = {
    ...withTurn,
    understanding: evaluation.understanding,
    stalled: evaluation.stalled,
    criterionStates: evaluation.criterionStates,
    nextProbeCriterionId: evaluation.nextProbeCriterionId,
    meterTrace: nextMeterTrace,
    costTracker
  };
  await getStore().saveSession(nextSession);
  logInfo("session.turn_saved", { sessionId: id, understanding: evaluation.understanding, stalled: evaluation.stalled, coveredCriterionIds: evaluation.coveredCriterionIds, costInr: costTracker.estimatedCostInr });
  return { statusCode: 200, body: { session: nextSession, agentText, understanding: evaluation.understanding, stalled: evaluation.stalled, coveredCriterionIds: evaluation.coveredCriterionIds, criterionStates: evaluation.criterionStates, nextProbeCriterionId: evaluation.nextProbeCriterionId } };
}

export async function finishSessionHandler(event: HttpEvent): Promise<HttpResponse<SkillRecord | { error: string }>> {
  const id = event.pathParameters?.id;
  if (!id) return notFound("Session was not found.");
  const session = await getStore().getSession(id);
  if (!session) return notFound("Session was not found.");
  const result = await createScorer().finalScore(session, await loadSkillRubric(session.skill));
  const record = result.record;
  await getStore().saveCredential(record);

  const finalCostTracker = updateCostTracker(
    session,
    result.tokenUsage?.inputTokens ?? 0,
    result.tokenUsage?.outputTokens ?? 0
  );

  await getStore().saveSession({
    ...session,
    status: "complete",
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recordId: record.id,
    costTracker: finalCostTracker
  });
  logInfo("session.finished", { sessionId: id, recordId: record.id, costInr: finalCostTracker.estimatedCostInr });
  return { statusCode: 200, body: record };
}

export async function getSessionHandler(event: HttpEvent): Promise<HttpResponse<{ session: Session; record?: SkillRecord } | { error: string }>> {
  const id = event.pathParameters?.id;
  if (!id) return notFound("Session was not found.");
  const session = await getStore().getSession(id);
  if (!session) return notFound("Session was not found.");
  const record = session.recordId ? await getStore().getCredential(session.recordId) : undefined;
  return { statusCode: 200, body: { session, record } };
}
