import { listSkillSummaries, type SkillSummary } from "../rubric";
import type { HttpEvent, HttpResponse } from "../types";

export async function listSkillsHandler(_event: HttpEvent): Promise<HttpResponse<SkillSummary[]>> {
  return { statusCode: 200, body: await listSkillSummaries() };
}
