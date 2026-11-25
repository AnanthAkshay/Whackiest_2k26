import { loadChallengeRubrics, loadSkillRubrics } from "./rubric";

const skillRubrics = await loadSkillRubrics();
const challengeRubrics = await loadChallengeRubrics(undefined, {
  warn: (msg) => console.log(`[REVIEW NOTICE] ${msg}`)
});

console.log("=== CONCEPTUAL SKILL RUBRICS ===");
for (const rubric of skillRubrics) {
  console.log(`${rubric.skill} v${rubric.version} (trainerCoSigned=${rubric.trainerCoSigned})`);
  console.log(`Basis: ${rubric.basisNote}`);
  for (const criterion of rubric.criteria) {
    console.log(`- ${criterion.id}: weight=${criterion.weight} (${criterion.sourceStatus})`);
  }
}

console.log("\n=== CHALLENGE RUBRICS ===");
for (const challenge of challengeRubrics) {
  console.log(`${challenge.challengeId} v${challenge.version} (linkedSkill=${challenge.skillRubricId}@v${challenge.skillRubricVersion}, trainerCoSigned=${challenge.trainerCoSigned})`);
  console.log(`Review Note: ${challenge.reviewNote}`);
  for (const chk of challenge.checks) {
    console.log(
      `- ${chk.checkId}: weight=${chk.weight} | critical=${chk.critical} | skillLink=${chk.linkedSkillCriterionId} | status=${chk.sourceStatus}`
    );
  }
}
