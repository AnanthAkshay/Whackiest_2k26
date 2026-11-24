import { createHmac } from "node:crypto";
import { config } from "../config";
import type { SkillRecord } from "../types";

/** Returns a deterministic payload with pre-sorted keys for HMAC signing. */
function sealPayload(record: SkillRecord): object {
  return {
    basisNote: record.basisNote ?? "",
    id: record.id,
    issuedAt: record.issuedAt,
    language: record.language,
    name: record.name ?? "",
    overallLevel: record.overallLevel,
    rubricVersion: record.rubricVersion,
    scores: record.scores.map((s) => ({
      criterionId: s.criterionId,
      evidenceQuote: s.evidenceQuote,
      label: s.label,
      score: s.score,
      status: s.status
    })),
    skill: record.skill,
    total: record.total
  };
}

/** Compute HMAC-SHA256 hex seal over the canonical JSON of a credential record. */
export function computeSeal(record: SkillRecord): string {
  const data = JSON.stringify(sealPayload(record));
  return createHmac("sha256", config.pageSecret).update(data).digest("hex");
}
