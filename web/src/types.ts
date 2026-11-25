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

// ==========================================
// Prooffolio 7-Stage User Journey UI Types
// ==========================================

export interface LearnerProfileUI {
  displayName: string;
  careerGoal: string;
  preferredLanguage: Language;
  coarseLocation: string;
  isDemoData: boolean;
}

export interface RoleOption {
  roleId: string;
  title: string;
  sector: string;
  description: string;
  skills: string[];
}

export interface LearningCard {
  id: string;
  title: string;
  summary: string;
  example: string;
  minutes: number;
}

export interface ChallengeInfo {
  challengeId: string;
  roleId: string;
  title: string;
  version: string;
  rubricVersion: string;
  acceptedFormat: string;
  maxSizeMb: number;
  estimatedSteps: string[];
  instructions: string;
}

export type ValidationCheckStatus = "pass" | "issue" | "not_applicable";

export interface ValidationCheckItem {
  id: string;
  title: string;
  explanation: string;
  status: ValidationCheckStatus;
  detail: string;
}

export interface ValidationReportUI {
  attemptId: string;
  fileName: string;
  fileSizeBytes: number;
  sha256: string;
  practicalScore: number;
  validatorVersion: string;
  isMock: boolean;
  checks: ValidationCheckItem[];
}

export type ECVEOutcome =
  | "Demonstrated"
  | "Partially demonstrated"
  | "Not yet demonstrated"
  | "Pending Human Review";

export interface ECVEResultUI {
  attemptId: string;
  P: number;
  U: number;
  C: number;
  composite: number;
  criticalGatesPassed: boolean;
  outcome: ECVEOutcome;
  reviewExplanation: string;
  isMock: boolean;
}

export interface OpportunitySkillRequirement {
  skillId: string;
  label: string;
  weight: number;
  matched: boolean;
}

export interface OpportunityItem {
  id: string;
  title: string;
  employer: string;
  roleId: string;
  district: string;
  city: string;
  pincode: string;
  sourceLabel: string;
  isSample: boolean;
  postedDate: string;
  requiredSkills: OpportunitySkillRequirement[];
  recommendedPractice: string;
}
