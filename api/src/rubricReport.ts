import { loadSkillRubrics } from "./rubric";

const rubrics = await loadSkillRubrics();
const unverified = rubrics.flatMap((rubric) => rubric.criteria
  .filter((criterion) => criterion.sourceStatus === "unverified")
  .map((criterion) => `${rubric.skill}/${criterion.id}`));

for (const rubric of rubrics) {
  console.log(`${rubric.skill} v${rubric.version}`);
  for (const criterion of rubric.criteria) {
    console.log(`- ${criterion.id}: ${criterion.weight} (${criterion.sourceStatus})`);
  }
}

console.log(`Unverified items: ${unverified.length ? unverified.join(", ") : "none"}`);
