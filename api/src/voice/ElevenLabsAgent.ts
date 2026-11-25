import { config } from "../config";
import type { SkillRubric } from "../rubric";
import type { AgentLevel, Language, VoiceMode } from "../types";
import type { FactSheet } from "../validator/pythonValidator";

/**
 * Provider Responsibility Split:
 * - ElevenLabs handles speech input/output (STT/TTS) and conversational turn-taking.
 * - Prooffolio's application backend owns selecting evidence-grounded questions,
 *   calling Bedrock where configured, validating outputs, and storing evidence/scores.
 * - ElevenLabs / LLMs must never invent spreadsheet facts or independently issue a pass.
 */
export interface VoiceConnection {
  mode: VoiceMode;
  signedUrl?: string;
  dynamicVariables: Record<string, string>;
  languageOverride: Language;
}

function probesFor(rubric: SkillRubric): string {
  return rubric.criteria
    .flatMap((criterion) => criterion.followUpProbes.map((probe) => `${criterion.name}: ${probe.question}`))
    .join("\n");
}

export function createDynamicVariables(skill: string, level: AgentLevel, language: Language, rubric: SkillRubric): Record<string, string> {
  return { skill, level, language, probes: probesFor(rubric) };
}

export function createExaminerDynamicVariables(
  challengeTitle: string,
  level: AgentLevel,
  language: Language,
  rubric: SkillRubric,
  factSheet?: FactSheet
): Record<string, string> {
  const factSummary = factSheet
    ? factSheet.formulaFacts
        .map((f) => `${f.sourceRef}: ${f.formula ?? "no-formula"} (${f.metric})`)
        .join("; ")
    : "No fact sheet attached";
  return {
    skill: challengeTitle,
    challengeTitle,
    level,
    language,
    probes: probesFor(rubric),
    factSheetSummary: factSummary
  };
}

async function createSignedUrl(): Promise<string> {
  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  url.searchParams.set("agent_id", config.elevenLabsAgentId!);
  const response = await fetch(url, { headers: { "xi-api-key": config.elevenLabsApiKey! } });
  if (!response.ok) throw new Error(`ElevenLabs signed URL request failed with status ${response.status}.`);
  const payload = await response.json() as { signed_url?: unknown };
  if (typeof payload.signed_url !== "string" || !payload.signed_url) throw new Error("ElevenLabs did not return a signed URL.");
  return payload.signed_url;
}

export async function createVoiceConnection(skill: string, language: Language, level: AgentLevel, rubric: SkillRubric): Promise<VoiceConnection> {
  const dynamicVariables = createDynamicVariables(skill, level, language, rubric);
  if (config.mockMode) return { mode: "mock", dynamicVariables, languageOverride: language };
  return { mode: "elevenlabs", signedUrl: await createSignedUrl(), dynamicVariables, languageOverride: language };
}
