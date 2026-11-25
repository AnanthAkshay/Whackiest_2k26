import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadChallengeRubric, loadSkillRubric } from "../rubric";
import type { FactSheet } from "../validator/pythonValidator";
import type { ConsentRecord } from "../domain/types";
import {
  applyVivaTurnWithConsent,
  buildArtifactGroundedQuestions,
  checkTranscriptConfidence,
  correctVivaTranscriptTurn,
  createArtifactVivaSession,
  sanitizeForBedrockPayload,
  validateQuestionGrounding
} from "./examiner";

async function loadSampleFactSheet(): Promise<FactSheet> {
  const raw = await readFile(resolve(process.cwd(), "..", "validator", "sample_fact_sheet.json"), "utf8").catch(
    async () => await readFile(resolve(process.cwd(), "validator", "sample_fact_sheet.json"), "utf8")
  );
  return JSON.parse(raw) as FactSheet;
}

const fullConsent: ConsentRecord = {
  consentId: "con_1",
  userId: "user_1",
  policyVersion: "2026.1",
  aiProcessingConsent: true,
  voiceRetentionConsent: true,
  publicSharingConsent: true,
  grantedAt: "2026-11-25T00:00:00.000Z"
};

test("Mock voice happy path generates bounded artifact-grounded questions in selected language", async () => {
  const [factSheet, skillRubric, challengeRubric] = await Promise.all([
    loadSampleFactSheet(),
    loadSkillRubric("excel"),
    loadChallengeRubric("retail_sales_cleanup", { warn: () => {} })
  ]);

  const questions = buildArtifactGroundedQuestions(factSheet, skillRubric, challengeRubric, "kn", 3);
  assert.ok(questions.length >= 2 && questions.length <= 3);
  assert.match(questions[0].text, /Summary!B2/);
  assert.match(questions[0].text, /SUM\(Sales_Data!E2:E17\)/);

  let session = createArtifactVivaSession({
    attemptId: "att_1",
    userId: "user_1",
    language: "kn",
    mockMode: true
  });
  assert.equal(session.providerConfig.provider, "mock");

  for (let i = 0; i < questions.length; i++) {
    const turnRes = applyVivaTurnWithConsent({
      vivaSession: session,
      speaker: "candidate",
      text: "Sales_Data!E2:E17 ಶ್ರೇಣಿಯ ಒಟ್ಟು ಮೊತ್ತವನ್ನು ಲೆಕ್ಕಹಾಕಲು ನಾನು =SUM ಸೂತ್ರವನ್ನು ಬಳಸಿದ್ದೇನೆ.",
      consent: fullConsent,
      questions
    });
    session = turnRes.vivaSession;
    assert.equal(turnRes.demoMode, true);
    if (i === questions.length - 1) {
      assert.equal(turnRes.finished, true);
      assert.equal(session.status, "complete");
    }
  }
});

test("Rejects fabricated cell references and validates known FactSheet references", async () => {
  const factSheet = await loadSampleFactSheet();

  // Valid known reference from FactSheet
  assert.doesNotThrow(() =>
    validateQuestionGrounding("I noticed SUM in Summary!B2. Why did you use it?", factSheet)
  );

  // Fabricated cell reference not present in FactSheet
  assert.throws(
    () => validateQuestionGrounding("I noticed SUMIF in cell G12. Why did you use it?", factSheet),
    /Fabricated or unverified cell reference 'G12'/
  );
  assert.throws(
    () => validateQuestionGrounding("Check cell Z99 on your sheet.", factSheet),
    /Fabricated or unverified cell reference 'Z99'/
  );
});

test("Provider unavailable or disconnect falls back safely to mock/text mode", () => {
  const session = createArtifactVivaSession({
    attemptId: "att_fallback",
    userId: "user_1",
    language: "en",
    mockMode: false,
    providerUnavailable: true
  });
  assert.equal(session.providerConfig.provider, "mock");
  assert.equal(session.providerConfig.voiceMode, "mock");
});

test("Low transcription confidence and ambiguous formula tokens trigger confirmation & text fallback", () => {
  const lowConf = checkTranscriptConfidence("uh", 0.42, "en");
  assert.equal(lowConf.confident, false);
  assert.equal(lowConf.needsConfirmation, true);
  assert.equal(lowConf.offerTextFallback, true);

  const ambiguous = checkTranscriptConfidence("I used some on the column", 0.9, "en");
  assert.equal(ambiguous.needsConfirmation, true);
  assert.equal(ambiguous.ambiguousToken, "some");
  assert.equal(ambiguous.offerTextFallback, true);
});

test("Transcript correction updates turn cleanly and text fallback completes session", async () => {
  const [factSheet, skillRubric, challengeRubric] = await Promise.all([
    loadSampleFactSheet(),
    loadSkillRubric("excel"),
    loadChallengeRubric("retail_sales_cleanup", { warn: () => {} })
  ]);
  const questions = buildArtifactGroundedQuestions(factSheet, skillRubric, challengeRubric, "en", 2);
  let session = createArtifactVivaSession({
    attemptId: "att_corr",
    userId: "user_1",
    language: "en",
    mockMode: true
  });

  const turn1 = applyVivaTurnWithConsent({
    vivaSession: session,
    speaker: "candidate",
    text: "I used some in B2",
    consent: fullConsent,
    confidenceScore: 0.55,
    questions
  });
  assert.equal(turn1.confidenceCheck.needsConfirmation, true);

  session = correctVivaTranscriptTurn(
    turn1.vivaSession,
    0,
    "I used =SUM(Sales_Data!E2:E17) in Summary!B2 so totals update automatically."
  );
  assert.match(session.transcriptReference.turns[0].text, /=SUM\(Sales_Data!E2:E17\)/);
});

test("Wrong language request is rejected and direct PII is stripped from Bedrock payloads", () => {
  assert.throws(
    () =>
      createArtifactVivaSession({
        attemptId: "att_lang",
        userId: "user_1",
        language: "fr" as unknown as "en",
        supportedLanguages: ["en", "hi", "kn"],
        mockMode: true
      }),
    /Unsupported or mismatched viva language/
  );

  const sanitized = sanitizeForBedrockPayload({
    userId: "cand_123",
    displayName: "Ananya Kumar",
    email: "ananya@example.com",
    phone: "+91-9999999999",
    coarseLocation: "Hubballi",
    transcriptText: "I used =SUM to add the amounts."
  });
  assert.equal((sanitized as Record<string, unknown>).userId, undefined);
  assert.equal((sanitized as Record<string, unknown>).displayName, undefined);
  assert.equal((sanitized as Record<string, unknown>).email, undefined);
  assert.equal((sanitized as Record<string, unknown>).phone, undefined);
  assert.equal(sanitized.transcriptText, "I used =SUM to add the amounts.");
});

test("Transcript turns are not stored when voiceRetentionConsent is false", async () => {
  const [factSheet, skillRubric, challengeRubric] = await Promise.all([
    loadSampleFactSheet(),
    loadSkillRubric("excel"),
    loadChallengeRubric("retail_sales_cleanup", { warn: () => {} })
  ]);
  const questions = buildArtifactGroundedQuestions(factSheet, skillRubric, challengeRubric, "en", 2);
  const session = createArtifactVivaSession({
    attemptId: "att_noconsent",
    userId: "user_1",
    language: "en",
    mockMode: true
  });

  const noVoiceConsent: ConsentRecord = {
    ...fullConsent,
    voiceRetentionConsent: false
  };
  const res = applyVivaTurnWithConsent({
    vivaSession: session,
    speaker: "candidate",
    text: "I used =SUM to add all sales amounts.",
    consent: noVoiceConsent,
    questions
  });
  assert.equal(res.vivaSession.transcriptReference.turns.length, 0);
});
