import type { AssessmentOutcome } from "../domain/types";

export interface LearnerSkillStatus {
  skillId: string;
  outcome: AssessmentOutcome;
  credentialStatus: "active" | "revoked" | "superseded" | "none";
}

export interface OpportunitySkillReq {
  skillId: string;
  label: string;
  weight: number;
  practiceResource: {
    title: string;
    route: string;
  };
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface OpportunityListing {
  id: string;
  title: string;
  employer: string;
  roleId: string;
  source: string;
  sourceUrl?: string;
  sampleOrLive: "sample" | "live";
  listingStatus: "active" | "stale" | "closed";
  district: string;
  city: string;
  pincode: string;
  coordinates?: Coordinates;
  updatedAt: string;
  requiredSkills: OpportunitySkillReq[];
}

export interface SkillMatchDetail {
  skillId: string;
  label: string;
  weight: number;
  matched: boolean;
  reason: string;
  practiceResource?: {
    title: string;
    route: string;
  };
}

export interface OpportunityMatchResult {
  opportunity: OpportunityListing;
  matchPercent: number;
  matchedWeight: number;
  totalWeight: number;
  matchedSkills: SkillMatchDetail[];
  missingSkills: SkillMatchDetail[];
  calculationExplanation: string;
  isStale: boolean;
  distanceKm?: number;
}

/**
 * Computes Match % = [sum(weight_i * matched_i) / sum(weight_i)] * 100.
 * A skill counts as matched ONLY if the learner has an active Demonstrated record.
 */
export function computeOpportunityMatch(
  opportunity: OpportunityListing,
  learnerSkills: LearnerSkillStatus[],
  nowMs = Date.now()
): OpportunityMatchResult {
  const skillMap = new Map<string, LearnerSkillStatus>();
  for (const s of learnerSkills) {
    skillMap.set(s.skillId, s);
  }

  const matchedSkills: SkillMatchDetail[] = [];
  const missingSkills: SkillMatchDetail[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const req of opportunity.requiredSkills) {
    if (req.weight <= 0) continue;
    totalWeight += req.weight;

    const record = skillMap.get(req.skillId);
    const isMatched =
      Boolean(record) &&
      record!.outcome === "Demonstrated" &&
      record!.credentialStatus === "active";

    if (isMatched) {
      matchedWeight += req.weight;
      matchedSkills.push({
        skillId: req.skillId,
        label: req.label,
        weight: req.weight,
        matched: true,
        reason: "Active Demonstrated skill"
      });
    } else {
      const gapReason = !record
        ? "Unassessed skill"
        : record.credentialStatus !== "active"
        ? `Credential is ${record.credentialStatus}`
        : `Outcome is ${record.outcome} (Demonstrated required)`;

      missingSkills.push({
        skillId: req.skillId,
        label: req.label,
        weight: req.weight,
        matched: false,
        reason: gapReason,
        practiceResource: req.practiceResource
      });
    }
  }

  const matchPercent = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  const calculationExplanation =
    totalWeight > 0
      ? `(${matchedWeight} / ${totalWeight}) × 100 = ${matchPercent}% (Decision support only; not a hiring decision)`
      : "0% (No positive skill weights specified on this listing)";

  const updatedMs = Date.parse(opportunity.updatedAt);
  const ageDays = Number.isFinite(updatedMs) ? (nowMs - updatedMs) / (1000 * 60 * 60 * 24) : 0;
  const isStale = opportunity.listingStatus === "stale" || ageDays > 30;

  return {
    opportunity,
    matchPercent,
    matchedWeight,
    totalWeight,
    matchedSkills,
    missingSkills,
    calculationExplanation,
    isStale
  };
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function filterAndMatchOpportunities(params: {
  opportunities: OpportunityListing[];
  learnerSkills: LearnerSkillStatus[];
  roleId?: string;
  locationQuery?: string;
  includeStale?: boolean;
  userCoords?: Coordinates;
  nowMs?: number;
}): OpportunityMatchResult[] {
  const query = params.locationQuery?.trim().toLowerCase() ?? "";

  const matched = params.opportunities
    .filter((opp) => opp.listingStatus !== "closed")
    .filter((opp) => !params.roleId || params.roleId === "all" || opp.roleId === params.roleId)
    .filter((opp) => {
      if (!query) return true;
      return (
        opp.city.toLowerCase().includes(query) ||
        opp.district.toLowerCase().includes(query) ||
        opp.pincode.includes(query)
      );
    })
    .map((opp) => {
      const res = computeOpportunityMatch(opp, params.learnerSkills, params.nowMs);
      if (params.userCoords && opp.coordinates) {
        res.distanceKm = haversineKm(params.userCoords, opp.coordinates);
      }
      return res;
    })
    .filter((res) => params.includeStale || !res.isStale);

  if (params.userCoords) {
    matched.sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
  }

  return matched;
}
