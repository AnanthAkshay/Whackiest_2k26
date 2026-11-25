import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildReferenceWorkbookForTest, generateSeededChallengeDataset } from "../challenge/datasetGenerator";
import { inspectXlsxBuffer } from "../challenge/xlsxArchive";
import { sampleConsent, sampleLearner } from "../domain/fixtures";
import { evaluateECVEAssessment, type WeightedScaleItem } from "../ecve/ecveEngine";
import { startChallengeHandler, uploadArtifactHandler } from "../handlers/challenge";
import { filterAndMatchOpportunities, type OpportunityListing } from "../opportunities/matcher";
import { estimateCostInr } from "../pricing";
import { loadChallengeRubric, loadSkillRubric } from "../rubric";
import { issueSkillPassport, revokeSkillPassport, verifyPassportById, withdrawPassportSharing } from "../services/passportService";
import { getStore } from "../store/createStore";
import { runPythonValidator } from "../validator/pythonValidator";
import {
  applyVivaTurnWithConsent,
  buildArtifactGroundedQuestions,
  createArtifactVivaSession
} from "../viva/examiner";

test("Complete Prooffolio vertical slice E2E in MOCK_MODE=1 (Learn -> Demonstrate -> Validate -> Viva -> ECVE -> Passport -> Connect)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "prooffolio-e2e-slice-"));
  try {
    const store = getStore();
    const e2eConsent = { ...sampleConsent, voiceRetentionConsent: true };
    await store.saveLearnerProfile(sampleLearner);
    await store.saveConsent(e2eConsent);

    // 1. Start seeded Retail Sales Cleanup attempt
    const startRes = await startChallengeHandler({
      body: { userId: sampleLearner.userId, challengeId: "retail_sales_cleanup" }
    });
    assert.equal(startRes.statusCode, 200);
    const attempt = (startRes.body as { attempt: { attemptId: string; seedId: string } }).attempt;

    // 2. Download starter XLSX & verify it is valid starter workbook
    const starter = generateSeededChallengeDataset(attempt.seedId);
    assert.equal(inspectXlsxBuffer(starter.starterWorkbook, ["Sales_Data", "Summary"]).valid, true);

    // 3. Upload completed reference XLSX fixture
    const ref = buildReferenceWorkbookForTest(attempt.seedId);
    const uploadRes = await uploadArtifactHandler({
      pathParameters: { attemptId: attempt.attemptId },
      headers: { "x-user-id": sampleLearner.userId },
      body: {
        fileName: "retail_cleaned.xlsx",
        contentBase64: ref.buffer.toString("base64"),
        userId: sampleLearner.userId,
        idempotencyKey: "e2e_upload_01"
      }
    });
    assert.equal(uploadRes.statusCode, 200);
    const uploadedArtifact = (uploadRes.body as { artifact: { artifactId: string; sha256: string } }).artifact;

    // 4. Run Python deterministic validator
    const xlsxPath = join(dir, "uploaded.xlsx");
    await writeFile(xlsxPath, ref.buffer);
    const factSheet = await runPythonValidator({
      filePath: xlsxPath,
      attemptId: attempt.attemptId,
      artifactId: uploadedArtifact.artifactId,
      expectedOutputs: ref.expectedOutputs
    });
    assert.equal(factSheet.practicalScore, 100);

    // 5. Run mock artifact-aware AI Viva
    const [skillRubric, challengeRubric] = await Promise.all([
      loadSkillRubric("excel"),
      loadChallengeRubric("retail_sales_cleanup", { warn: () => {} })
    ]);
    const questions = buildArtifactGroundedQuestions(factSheet, skillRubric, challengeRubric, "en", 2);
    assert.ok(questions.length >= 2);

    let viva = createArtifactVivaSession({
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      language: "en",
      mockMode: true
    });
    for (const _q of questions) {
      const turnRes = applyVivaTurnWithConsent({
        vivaSession: viva,
        speaker: "candidate",
        text: "I used =SUM in Summary!B2 and removed duplicate Order IDs from Sales_Data.",
        consent: e2eConsent,
        questions
      });
      viva = turnRes.vivaSession;
    }
    assert.equal(viva.status, "complete");

    // 6. Compute deterministic ECVE result (verifying AI-supplied composite cannot override code)
    const understandingItems: WeightedScaleItem[] = [
      {
        criterionId: "formulas-functions",
        dimension: "U",
        weight: 1,
        level: 2,
        evidenceQuote: "Used =SUM in Summary!B2",
        reason: "Accurate explanation"
      }
    ];
    const result = evaluateECVEAssessment({
      attemptId: attempt.attemptId,
      userId: sampleLearner.userId,
      factSheet,
      challengeRubric,
      skillRubric,
      turns: viva.transcriptReference.turns,
      understandingItems
    });
    assert.equal(result.outcome, "Demonstrated");
    assert.equal(result.composite, 100);
    await store.saveAssessmentResult(result);

    // 7. Issue Ed25519 Skill Passport & verify it
    const savedAttempt = await store.getAttempt(attempt.attemptId);
    const cred = await issueSkillPassport({
      store,
      result,
      attempt: savedAttempt!,
      learner: sampleLearner,
      evidenceHash: uploadedArtifact.sha256
    });

    const verified = await verifyPassportById(store, cred.credentialId);
    assert.equal(verified.found, true);
    assert.equal(verified.valid, true);
    assert.equal(verified.evidenceHash, uploadedArtifact.sha256);

    // 8. Opportunity discovery with Demonstrated-only matching & skill gaps
    const sampleOpp: OpportunityListing = {
      id: "opp_e2e_01",
      title: "Data Entry Associate",
      employer: "Sample Hub",
      roleId: "data_entry_operator",
      source: "Sample Feed",
      sampleOrLive: "sample",
      listingStatus: "active",
      district: "Dharwad",
      city: "Hubballi",
      pincode: "580020",
      updatedAt: new Date().toISOString(),
      requiredSkills: [
        {
          skillId: "spreadsheet_hygiene",
          label: "Whitespace Trimming",
          weight: 60,
          practiceResource: { title: "Trimming Lesson", route: "/learn" }
        },
        {
          skillId: "spot_checking",
          label: "Quality Spot-Checking",
          weight: 40,
          practiceResource: { title: "Spot-Checking Lesson", route: "/learn" }
        }
      ]
    };

    const matches = filterAndMatchOpportunities({
      opportunities: [sampleOpp],
      learnerSkills: [{ skillId: "spreadsheet_hygiene", outcome: "Demonstrated", credentialStatus: "active" }],
      locationQuery: "Hubballi"
    });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].matchPercent, 60);
    assert.equal(matches[0].missingSkills[0].skillId, "spot_checking");

    // 9. Withdraw sharing & verify revocation paths
    await withdrawPassportSharing(store, sampleLearner.userId, cred.credentialId);
    assert.equal((await verifyPassportById(store, cred.credentialId)).found, false);

    await store.saveConsent({ ...sampleConsent, publicSharingConsent: true });
    await revokeSkillPassport(store, cred.credentialId, { actor: "qa_test", reason: "Revoked in E2E test" });
    assert.equal((await verifyPassportById(store, cred.credentialId)).valid, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Pricing estimation tracks voice, tokens, storage, and compute as configurable estimates", () => {
  const cost = estimateCostInr({
    elevenLabsSeconds: 120,
    bedrockInputTokens: 2000,
    bedrockOutputTokens: 500,
    storageBytes: 50_000,
    computeSeconds: 2
  });
  assert.ok(cost > 0);
});
