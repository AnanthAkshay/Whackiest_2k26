export type Language = "en" | "hi" | "kn";
export type AgentLevel = "new" | "some" | "tough";
export type Speaker = "candidate" | "agent";
export type VoiceMode = "mock" | "elevenlabs";
export type CriterionStatus = "not_covered" | "wrong" | "partial" | "correct";

export interface SkillSummary {
  skill: string;
  languages: Language[];
  basisNote: string;
  trainerCoSigned: boolean;
}

export interface TranscriptTurn {
  speaker: Speaker;
  text: string;
  createdAt: string;
}

export interface CriterionState {
  criterionId: string;
  status: CriterionStatus;
  evidenceQuote: string;
}

export interface MeterTraceEntry {
  turnIndex: number;
  value: number;
}

export interface Session {
  id: string;
  skill: string;
  language: Language;
  level: AgentLevel;
  status: "active" | "complete";
  understanding: number;
  stalled: boolean;
  startedAt: string;
  updatedAt: string;
  voiceMode: VoiceMode;
  mockQuestionIndex?: number;
  criterionStates: CriterionState[];
  nextProbeCriterionId?: string;
  transcript: TranscriptTurn[];
  meterTrace: MeterTraceEntry[];
}

export interface CriterionScore {
  criterionId: string;
  label: string;
  status: CriterionStatus;
  score: number;
  evidenceQuote: string;
  reason: string;
  improveTip?: string;
}

export interface SkillRecord {
  id: string;
  sessionId: string;
  skill: string;
  language: Language;
  rubricVersion: string;
  total: number;
  overallLevel: "Starting" | "Developing" | "Ready to practise";
  scores: CriterionScore[];
  meterTrace: MeterTraceEntry[];
  tooShort: boolean;
  issuedAt: string;
  name?: string;
  shared?: boolean;
  seal?: string;
  basisNote?: string;
  pageId?: string;
}
