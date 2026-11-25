import { randomUUID } from "node:crypto";
import type { ChallengeRubricFile, SkillRubric } from "../rubric";
import type { FactSheet } from "../validator/pythonValidator";
import type { ConsentRecord, VivaSession, VivaTurn } from "../domain/types";
import type { Language } from "../types";

export interface GroundedVivaQuestion {
  questionId: string;
  text: string;
  factId: string;
  sourceRef: string;
  linkedCriterionId: string;
}

export interface TranscriptConfidenceCheck {
  confident: boolean;
  needsConfirmation: boolean;
  ambiguousToken?: string;
  clarificationPrompt?: string;
  offerTextFallback: boolean;
}

export interface VivaTurnResult {
  vivaSession: VivaSession;
  nextQuestion?: GroundedVivaQuestion;
  confidenceCheck: TranscriptConfidenceCheck;
  finished: boolean;
  demoMode: boolean;
}

const CELL_OR_RANGE_RE = /\b(?:[A-Za-z_]+!)?[A-Z]{1,3}\d{1,5}(?::[A-Z]{1,3}\d{1,5})?\b/g;
const AMBIGUOUS_FORMULA_RE = /\b(some|sum if|count if|average of|equal to)\b/i;
const PROMPT_INJECTION_RE = /(ignore\s+(all\s+)?previous\s+instructions|system\s*:|assistant\s*:|<\/?system>|<\/?instruction>|issue\s+demonstrated|grant\s+pass|override\s+rubric)/gi;

/**
 * Sanitizes untrusted workbook cell text, filenames, or user input before
 * interpolating into AI Examiner or Bedrock prompt payloads.
 */
export function sanitizeUntrustedWorkbookText(raw: string, maxLength = 300): string {
  const withoutControl = raw.replace(/[\u0000-\u001f\u007f]/g, " ");
  const neutralized = withoutControl.replace(PROMPT_INJECTION_RE, "[REDACTED_UNTRUSTED_TEXT]");
  return neutralized.trim().slice(0, maxLength);
}

export function detectPromptInjectionAttempt(raw: string): boolean {
  PROMPT_INJECTION_RE.lastIndex = 0;
  return PROMPT_INJECTION_RE.test(raw);
}

/**
 * Extracts all known cell/range references from a verified validator FactSheet.
 */
export function extractKnownSourceRefs(factSheet: FactSheet): Set<string> {
  const known = new Set<string>();
  const addRefs = (text?: string | null): void => {
    if (!text) return;
    const matches = text.match(CELL_OR_RANGE_RE);
    if (matches) {
      for (const m of matches) {
        known.add(m.toUpperCase());
        // Also allow bare cell ref without sheet prefix if sheet!cell is known
        if (m.includes("!")) {
          known.add(m.split("!")[1].toUpperCase());
        }
      }
    }
  };

  for (const ff of factSheet.formulaFacts) {
    addRefs(ff.sourceRef);
    addRefs(ff.formula);
  }
  for (const cr of factSheet.checkResults) {
    addRefs(cr.sourceRef);
  }
  for (const qo of factSheet.qualitativeObservations) {
    addRefs(qo.sourceRef);
  }
  return known;
}

/**
 * Validates that every cell/range reference in an AI Examiner question actually exists in the FactSheet.
 * Rejects fabricated cell references.
 */
export function validateQuestionGrounding(questionText: string, factSheet: FactSheet): void {
  const knownRefs = extractKnownSourceRefs(factSheet);
  const found = questionText.match(CELL_OR_RANGE_RE) ?? [];
  for (const ref of found) {
    const normalized = ref.toUpperCase();
    // Ignore common non-cell tokens like "ORD-1001" (already excluded by regex) or "B2B"
    if (!knownRefs.has(normalized)) {
      throw new Error(
        `Fabricated or unverified cell reference '${ref}' in examiner question. Only FactSheet references are allowed.`
      );
    }
  }
}

/**
 * Generates a bounded sequence of artifact-grounded questions in the learner's tested language.
 */
export function buildArtifactGroundedQuestions(
  factSheet: FactSheet,
  _skillRubric: SkillRubric,
  challengeRubric: ChallengeRubricFile,
  language: Language,
  maxQuestions = 4
): GroundedVivaQuestion[] {
  const questions: GroundedVivaQuestion[] = [];

  // 1. Grounded question on a verified formula fact (if present)
  const formulaFact = factSheet.formulaFacts.find((f) => f.formula && f.supported);
  if (formulaFact) {
    const ref = formulaFact.sourceRef;
    const formula = formulaFact.formula ?? "formula";
    const textByLang: Record<Language, string> = {
      en: `I noticed ${formula} in cell ${ref} for ${formulaFact.metric}. Why did you choose this formula instead of typing the number?`,
      hi: `मैंने ${ref} सेल में ${formulaFact.metric} के लिए ${formula} देखा। आपने सीधे संख्या लिखने के बजाय यह फ़ॉर्मूला क्यों चुना?`,
      kn: `${ref} ಸೆಲ್‌ನಲ್ಲಿ ${formulaFact.metric} ಗಾಗಿ ${formula} ಬಳಸಿರುವುದನ್ನು ನಾನು ಗಮನಿಸಿದೆ. ಸಂಖ್ಯೆಯನ್ನು ನೇರವಾಗಿ ಟೈಪ್ ಮಾಡುವ ಬದಲು ಈ ಸೂತ್ರವನ್ನು ಏಕೆ ಆರಿಸಿದಿರಿ?`
    };
    const qText = textByLang[language];
    validateQuestionGrounding(qText, factSheet);
    questions.push({
      questionId: `q_formula_${formulaFact.factId}`,
      text: qText,
      factId: formulaFact.factId,
      sourceRef: ref,
      linkedCriterionId: "formulas-functions"
    });
  }

  // 2. Grounded question on duplicates or date normalization check
  const dupCheck = factSheet.checkResults.find((c) => c.checkId === "chk_duplicates_removed");
  if (dupCheck) {
    const uniqueCount = factSheet.rowCounts.uniqueOrders ?? factSheet.rowCounts.salesDataRows ?? 0;
    const textByLang: Record<Language, string> = {
      en: `Your Sales_Data sheet (${dupCheck.sourceRef}) shows ${uniqueCount} unique orders. How did you check for duplicate Order IDs, and what happens to totals if duplicates stay?`,
      hi: `आपकी Sales_Data शीट (${dupCheck.sourceRef}) में ${uniqueCount} अद्वितीय ऑर्डर हैं। आपने डुप्लिकेट Order ID की जाँच कैसे की?`,
      kn: `ನಿಮ್ಮ Sales_Data ಶೀಟ್ (${dupCheck.sourceRef}) ನಲ್ಲಿ ${uniqueCount} ಅನನ್ಯ ಆರ್ಡರ್‌ಗಳಿವೆ. ನಕಲಿ Order ID ಗಳನ್ನು ನೀವು ಹೇಗೆ ಪರಿಶೀಲಿಸಿದಿರಿ?`
    };
    const qText = textByLang[language];
    validateQuestionGrounding(qText, factSheet);
    questions.push({
      questionId: "q_duplicates_check",
      text: qText,
      factId: "fact_unique_order_count",
      sourceRef: dupCheck.sourceRef,
      linkedCriterionId: "tables-sorting-filtering"
    });
  }

  // 3. Grounded question on date standardization
  const dateCheck = factSheet.checkResults.find((c) => c.checkId === "chk_date_normalization");
  if (dateCheck) {
    const textByLang: Record<Language, string> = {
      en: `Looking at the Date column (${dateCheck.sourceRef}), why is using one consistent format like YYYY-MM-DD important before sorting or reporting?`,
      hi: `Date कॉलम (${dateCheck.sourceRef}) में YYYY-MM-DD जैसा एक समान प्रारूप क्यों ज़रूरी है?`,
      kn: `Date ಕಾಲಮ್ (${dateCheck.sourceRef}) ನಲ್ಲಿ YYYY-MM-DD ನಂತಹ ಒಂದೇ ಸ್ವರೂಪ ಏಕೆ ಮುಖ್ಯವಾಗಿದೆ?`
    };
    const qText = textByLang[language];
    validateQuestionGrounding(qText, factSheet);
    questions.push({
      questionId: "q_dates_check",
      text: qText,
      factId: "fact_dates_standardized",
      sourceRef: dateCheck.sourceRef,
      linkedCriterionId: "formatting-number-formats"
    });
  }

  // 4. Grounded question on category COUNTIF / what-if
  const countIfFact = factSheet.formulaFacts.find((f) => f.formula?.toUpperCase().includes("COUNTIF"));
  if (countIfFact) {
    const textByLang: Record<Language, string> = {
      en: `In ${countIfFact.sourceRef}, you used ${countIfFact.formula}. How would the result change if a row's category changed from Electronics to General?`,
      hi: `${countIfFact.sourceRef} में आपने ${countIfFact.formula} का उपयोग किया। यदि किसी पंक्ति की श्रेणी बदल जाए तो परिणाम कैसे बदलेगा?`,
      kn: `${countIfFact.sourceRef} ನಲ್ಲಿ ನೀವು ${countIfFact.formula} ಬಳಸಿದ್ದೀರಿ. ಒಂದು ಸಾಲಿನ ವರ್ಗ ಬದಲಾದರೆ ಫಲಿತಾಂಶ ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ?`
    };
    const qText = textByLang[language];
    validateQuestionGrounding(qText, factSheet);
    questions.push({
      questionId: `q_whatif_${countIfFact.factId}`,
      text: qText,
      factId: countIfFact.factId,
      sourceRef: countIfFact.sourceRef,
      linkedCriterionId: challengeRubric.checks.find((c) => c.checkId === "chk_summary_formulas")?.linkedSkillCriterionId ?? "formulas-functions"
    });
  }

  return questions.slice(0, Math.max(2, maxQuestions));
}

/**
 * Checks transcript confidence and ambiguous formula tokens.
 */
export function checkTranscriptConfidence(
  text: string,
  confidenceScore = 1.0,
  language: Language = "en"
): TranscriptConfidenceCheck {
  const lowConfidence = confidenceScore < 0.65 || text.trim().length < 4;
  const ambiguousMatch = text.match(AMBIGUOUS_FORMULA_RE);

  if (lowConfidence) {
    const promptByLang: Record<Language, string> = {
      en: "I didn't catch that clearly. Could you repeat or confirm your transcript, or type your answer instead?",
      hi: "मैं इसे स्पष्ट रूप से नहीं सुन सका। कृपया दोहराएँ या लिखकर उत्तर दें।",
      kn: "ನನಗೆ ಅದು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನರಾವರ್ತಿಸಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ."
    };
    return {
      confident: false,
      needsConfirmation: true,
      clarificationPrompt: promptByLang[language],
      offerTextFallback: true
    };
  }

  if (ambiguousMatch) {
    return {
      confident: true,
      needsConfirmation: true,
      ambiguousToken: ambiguousMatch[0],
      clarificationPrompt: `Did you mean a spreadsheet formula like =SUM or =COUNTIF when you said "${ambiguousMatch[0]}"? Please confirm or type it.`,
      offerTextFallback: true
    };
  }

  return {
    confident: true,
    needsConfirmation: false,
    offerTextFallback: false
  };
}

/**
 * Strips direct PII/identifiers from any payload sent to Bedrock.
 */
export function sanitizeForBedrockPayload<T extends Record<string, unknown>>(
  payload: T
): Omit<T, "userId" | "displayName" | "email" | "phone" | "coarseLocation" | "name"> {
  const copy = { ...payload };
  delete copy.userId;
  delete copy.displayName;
  delete copy.email;
  delete copy.phone;
  delete copy.coarseLocation;
  delete copy.name;
  return copy;
}

export function createArtifactVivaSession(options: {
  attemptId: string;
  userId: string;
  language: Language;
  supportedLanguages?: string[];
  mockMode: boolean;
  bedrockModelId?: string;
  providerUnavailable?: boolean;
}): VivaSession {
  const allowed = options.supportedLanguages ?? ["en", "hi", "kn"];
  if (!allowed.includes(options.language)) {
    throw new Error(`Unsupported or mismatched viva language '${options.language}'.`);
  }

  const useMock = options.mockMode || Boolean(options.providerUnavailable);

  return {
    sessionId: `viva_${randomUUID().slice(0, 12)}`,
    attemptId: options.attemptId,
    userId: options.userId,
    language: options.language,
    status: "active",
    providerConfig: {
      provider: useMock ? "mock" : "elevenlabs",
      voiceMode: useMock ? "mock" : "elevenlabs",
      ...(options.bedrockModelId ? { agentId: options.bedrockModelId } : {})
    },
    transcriptReference: {
      turnCount: 0,
      turns: []
    },
    durationSeconds: 0,
    startedAt: new Date().toISOString()
  };
}

export function applyVivaTurnWithConsent(options: {
  vivaSession: VivaSession;
  speaker: "candidate" | "agent";
  text: string;
  consent: ConsentRecord;
  confidenceScore?: number;
  questions: GroundedVivaQuestion[];
}): VivaTurnResult {
  const { vivaSession, speaker, text, consent, confidenceScore = 1.0, questions } = options;

  const confidenceCheck =
    speaker === "candidate"
      ? checkTranscriptConfidence(text, confidenceScore, vivaSession.language)
      : { confident: true, needsConfirmation: false, offerTextFallback: false };

  const turn: VivaTurn = {
    speaker,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  // Respect explicit voice/transcript retention consent; raw audio is never stored
  const updatedTurns = consent.voiceRetentionConsent
    ? [...vivaSession.transcriptReference.turns, turn]
    : vivaSession.transcriptReference.turns;

  const nextTurnCount = vivaSession.transcriptReference.turnCount + 1;
  const candidateTurnsCount = consent.voiceRetentionConsent
    ? updatedTurns.filter((t) => t.speaker === "candidate").length
    : nextTurnCount;
  const finished = candidateTurnsCount >= questions.length && !confidenceCheck.needsConfirmation;

  const updatedSession: VivaSession = {
    ...vivaSession,
    status: finished ? "complete" : "active",
    endedAt: finished ? new Date().toISOString() : undefined,
    transcriptReference: {
      turnCount: nextTurnCount,
      turns: updatedTurns
    }
  };

  const nextQuestion =
    !finished && !confidenceCheck.needsConfirmation
      ? questions[Math.min(candidateTurnsCount, questions.length - 1)]
      : undefined;

  return {
    vivaSession: updatedSession,
    nextQuestion,
    confidenceCheck,
    finished,
    demoMode: vivaSession.providerConfig.provider === "mock"
  };
}

export function correctVivaTranscriptTurn(
  vivaSession: VivaSession,
  turnIndex: number,
  correctedText: string
): VivaSession {
  const trimmed = correctedText.trim();
  if (!trimmed) throw new Error("Corrected transcript text cannot be empty.");
  const turns = vivaSession.transcriptReference.turns.map((turn, idx) =>
    idx === turnIndex ? { ...turn, text: trimmed } : turn
  );
  return {
    ...vivaSession,
    transcriptReference: {
      ...vivaSession.transcriptReference,
      turns
    }
  };
}
