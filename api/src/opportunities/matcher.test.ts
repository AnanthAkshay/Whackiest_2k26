import assert from "node:assert/strict";
import test from "node:test";
import {
  computeOpportunityMatch,
  filterAndMatchOpportunities,
  type LearnerSkillStatus,
  type OpportunityListing
} from "./matcher";

const sampleOpp = (overrides: Partial<OpportunityListing> = {}): OpportunityListing => ({
  id: "opp_1",
  title: "Data Entry Associate",
  employer: "Sample Retail Hub",
  roleId: "data_entry_operator",
  source: "Prooffolio Sample Feed",
  sampleOrLive: "sample",
  listingStatus: "active",
  district: "Dharwad",
  city: "Hubballi",
  pincode: "580020",
  coordinates: { lat: 15.3647, lon: 75.124 },
  updatedAt: "2026-11-24T00:00:00.000Z",
  requiredSkills: [
    {
      skillId: "spreadsheet_hygiene",
      label: "Whitespace Trimming",
      weight: 40,
      practiceResource: { title: "Trimming Lesson", route: "/learn" }
    },
    {
      skillId: "date_normalization",
      label: "ISO Date Standardization",
      weight: 30,
      practiceResource: { title: "Date Formatting Lesson", route: "/learn" }
    },
    {
      skillId: "summary_aggregation",
      label: "Summary Formulas",
      weight: 30,
      practiceResource: { title: "Formulas Lesson", route: "/learn" }
    }
  ],
  ...overrides
});

const nowMs = Date.parse("2026-11-25T00:00:00.000Z");

test("Demonstrated-only matching: active Demonstrated matches, while Partial/Pending/Revoked/Missing count as gaps", () => {
  const skills: LearnerSkillStatus[] = [
    { skillId: "spreadsheet_hygiene", outcome: "Demonstrated", credentialStatus: "active" },
    { skillId: "date_normalization", outcome: "Partially demonstrated", credentialStatus: "none" },
    { skillId: "summary_aggregation", outcome: "Demonstrated", credentialStatus: "revoked" }
  ];

  const res = computeOpportunityMatch(sampleOpp(), skills, nowMs);
  assert.equal(res.matchPercent, 40);
  assert.equal(res.matchedSkills.length, 1);
  assert.equal(res.missingSkills.length, 2);
  assert.ok(res.missingSkills.every((gap) => Boolean(gap.practiceResource?.route)));
  assert.match(res.calculationExplanation, /\(40 \/ 100\) × 100 = 40%/);
});

test("All gaps returns 0% and no required weights returns 0% safely without NaN", () => {
  const allGaps = computeOpportunityMatch(sampleOpp(), [], nowMs);
  assert.equal(allGaps.matchPercent, 0);
  assert.equal(allGaps.missingSkills.length, 3);

  const noWeights = computeOpportunityMatch(sampleOpp({ requiredSkills: [] }), [], nowMs);
  assert.equal(noWeights.matchPercent, 0);
  assert.equal(Number.isNaN(noWeights.matchPercent), false);
});

test("Sample/live labelling, stale listings, and optional location filtering/sorting", () => {
  const freshHubballi = sampleOpp({ id: "opp_hub", sampleOrLive: "sample" });
  const freshBengaluru = sampleOpp({
    id: "opp_blr",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    pincode: "560001",
    sampleOrLive: "live",
    coordinates: { lat: 12.9716, lon: 77.5946 }
  });
  const staleListing = sampleOpp({
    id: "opp_stale",
    updatedAt: "2026-09-01T00:00:00.000Z" // > 30 days old
  });

  // Without GPS: filters cleanly by city/district/pincode, hides stale by default
  const byPincode = filterAndMatchOpportunities({
    opportunities: [freshHubballi, freshBengaluru, staleListing],
    learnerSkills: [],
    locationQuery: "560001",
    nowMs
  });
  assert.equal(byPincode.length, 1);
  assert.equal(byPincode[0].opportunity.id, "opp_blr");
  assert.equal(byPincode[0].opportunity.sampleOrLive, "live");
  assert.equal(byPincode[0].distanceKm, undefined);

  // With optional GPS coordinates: sorts by calculated distance
  const withGps = filterAndMatchOpportunities({
    opportunities: [freshBengaluru, freshHubballi],
    learnerSkills: [],
    userCoords: { lat: 15.36, lon: 75.12 }, // near Hubballi
    nowMs
  });
  assert.equal(withGps[0].opportunity.id, "opp_hub");
  assert.ok((withGps[0].distanceKm ?? 999) < (withGps[1].distanceKm ?? 0));

  // Empty state when no matching opportunities exist
  const empty = filterAndMatchOpportunities({
    opportunities: [freshHubballi, staleListing],
    learnerSkills: [],
    locationQuery: "999999",
    nowMs
  });
  assert.equal(empty.length, 0);
});
