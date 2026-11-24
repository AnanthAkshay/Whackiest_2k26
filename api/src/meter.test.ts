import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeRawMeter,
  smoothMeter,
  detectStall,
  computeMeter,
  type WeightedCriterion,
  type MeterTraceEntry
} from "./meter";
import type { CriterionState, TranscriptTurn } from "./types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function state(id: string, status: CriterionState["status"]): CriterionState {
  return { criterionId: id, status, evidenceQuote: status === "not_covered" ? "" : "evidence" };
}

function turn(speaker: "candidate" | "agent", text: string): TranscriptTurn {
  return { speaker, text, createdAt: "2026-01-01T00:00:00Z" };
}

const excelCriteria: WeightedCriterion[] = [
  { id: "worksheets-workbooks-navigation", weight: 0.1 },
  { id: "cells-ranges-references", weight: 0.2 },
  { id: "formulas-functions", weight: 0.25 },
  { id: "formatting-number-formats", weight: 0.1 },
  { id: "tables-sorting-filtering", weight: 0.15 },
  { id: "charts", weight: 0.2 }
];

function allStatus(status: CriterionState["status"]): CriterionState[] {
  return excelCriteria.map((c) => state(c.id, status));
}

/* ------------------------------------------------------------------ */
/*  computeRawMeter                                                   */
/* ------------------------------------------------------------------ */

describe("computeRawMeter", () => {
  it("returns 0 when all criteria are not_covered", () => {
    assert.equal(computeRawMeter(excelCriteria, allStatus("not_covered")), 0);
  });

  it("returns 100 when all criteria are correct", () => {
    assert.equal(computeRawMeter(excelCriteria, allStatus("correct")), 100);
  });

  it("returns 50 when all criteria are partial", () => {
    assert.equal(computeRawMeter(excelCriteria, allStatus("partial")), 50);
  });

  it("returns 0 when all criteria are wrong (points=0 minus penalty)", () => {
    assert.equal(computeRawMeter(excelCriteria, allStatus("wrong")), 0);
  });

  it("applies wrong penalty: correct except one wrong", () => {
    const states = excelCriteria.map((c) =>
      c.id === "cells-ranges-references"
        ? state(c.id, "wrong")
        : state(c.id, "correct")
    );
    // base = (0.1*1 + 0.2*0 + 0.25*1 + 0.1*1 + 0.15*1 + 0.2*1) = 0.8
    // penalty = 0.05 * 0.2 = 0.01
    // raw = round((0.8 - 0.01) * 100) = round(79) = 79
    assert.equal(computeRawMeter(excelCriteria, states), 79);
  });

  it("floors at 0 when penalty exceeds base", () => {
    // All wrong: base = 0, penalty > 0 → floor at 0
    assert.equal(computeRawMeter(excelCriteria, allStatus("wrong")), 0);
  });

  it("computes weighted partial scores correctly", () => {
    const states = [
      state("worksheets-workbooks-navigation", "correct"),  // 0.1 * 1.0 = 0.10
      state("cells-ranges-references", "partial"),           // 0.2 * 0.5 = 0.10
      state("formulas-functions", "not_covered"),            // 0.25 * 0  = 0
      state("formatting-number-formats", "correct"),         // 0.1 * 1.0 = 0.10
      state("tables-sorting-filtering", "partial"),          // 0.15 * 0.5 = 0.075
      state("charts", "not_covered")                         // 0.2 * 0  = 0
    ];
    // total = 0.10 + 0.10 + 0 + 0.10 + 0.075 + 0 = 0.375
    // raw = round(0.375 * 100) = 38
    assert.equal(computeRawMeter(excelCriteria, states), 38);
  });
});

/* ------------------------------------------------------------------ */
/*  smoothMeter                                                       */
/* ------------------------------------------------------------------ */

describe("smoothMeter", () => {
  it("does not constrain upward moves", () => {
    assert.equal(smoothMeter(80, 20), 80);
  });

  it("allows drops up to 10 points", () => {
    assert.equal(smoothMeter(40, 50), 40);
  });

  it("caps large drops at 10 points from previous", () => {
    assert.equal(smoothMeter(10, 50), 40);
  });

  it("caps a drop from 100 to 0 at 90", () => {
    assert.equal(smoothMeter(0, 100), 90);
  });

  it("returns exact value when drop is exactly 10", () => {
    assert.equal(smoothMeter(60, 70), 60);
  });

  it("returns raw when equal to previous", () => {
    assert.equal(smoothMeter(42, 42), 42);
  });
});

/* ------------------------------------------------------------------ */
/*  detectStall                                                       */
/* ------------------------------------------------------------------ */

describe("detectStall", () => {
  it("returns false with fewer than 2 candidate turns", () => {
    const transcript = [turn("agent", "hello"), turn("candidate", "hi")];
    assert.equal(detectStall(transcript, allStatus("not_covered"), allStatus("not_covered")), false);
  });

  it("returns true when two candidate turns produce identical states", () => {
    const transcript = [
      turn("agent", "q1"), turn("candidate", "a1"),
      turn("agent", "q2"), turn("candidate", "a2")
    ];
    const before = allStatus("partial");
    const after = allStatus("partial");
    assert.equal(detectStall(transcript, after, before), true);
  });

  it("returns false when second turn improves a criterion", () => {
    const transcript = [
      turn("agent", "q1"), turn("candidate", "a1"),
      turn("agent", "q2"), turn("candidate", "a2")
    ];
    const before = allStatus("partial");
    const after = excelCriteria.map((c) =>
      c.id === "charts" ? state(c.id, "correct") : state(c.id, "partial")
    );
    assert.equal(detectStall(transcript, after, before), false);
  });
});

/* ------------------------------------------------------------------ */
/*  computeMeter (integration)                                        */
/* ------------------------------------------------------------------ */

describe("computeMeter", () => {
  it("returns correct raw, value, and stalled for a standard case", () => {
    const transcript = [turn("agent", "q"), turn("candidate", "a")];
    const prev = allStatus("not_covered");
    const cur = excelCriteria.map((c) =>
      c.id === "formulas-functions" ? state(c.id, "correct") : state(c.id, "not_covered")
    );
    const result = computeMeter(excelCriteria, cur, prev, 0, transcript);
    assert.equal(result.raw, 25);    // 0.25 * 1.0 * 100
    assert.equal(result.value, 25);  // no drop, no smoothing
    assert.equal(result.stalled, false);
  });

  it("smooths a large drop", () => {
    const transcript = [
      turn("agent", "q1"), turn("candidate", "a1"),
      turn("agent", "q2"), turn("candidate", "a2")
    ];
    const prev = allStatus("correct");
    const cur = allStatus("wrong");
    const result = computeMeter(excelCriteria, cur, prev, 100, transcript);
    assert.equal(result.raw, 0);
    assert.equal(result.value, 90);  // smoothed: 100 - 10 = 90
    // No upward movement (correct→wrong is downward), so stalled is true
    assert.equal(result.stalled, true);
  });
});

/* ------------------------------------------------------------------ */
/*  Bluffer scenario: must stay under 40                              */
/* ------------------------------------------------------------------ */

describe("bluffer scenario", () => {
  it("stays under 40 when candidate uses correct-sounding terms without explanation", () => {
    // The bluffer mentions terms (SUM, formula, table, chart, filter, sort, reference)
    // but never explains *why* or *how*, so at most they get "partial" on some criteria
    // and never "correct". The mock scorer would give partial for keyword hits.
    // With the rubric weights, partial across all 6 = 50, but a bluffer who merely
    // parrots the agent gets detected and zeroed. Even without detection, a realistic
    // bluffer gets at most partial on ~3 criteria.
    //
    // Simulate: 3 criteria partial (the ones with easy keyword hits), rest not_covered.
    const blufferStates: CriterionState[] = [
      state("worksheets-workbooks-navigation", "not_covered"),
      state("cells-ranges-references", "partial"),        // mentions "reference", "$A$1"
      state("formulas-functions", "partial"),              // mentions "SUM", "formula"
      state("formatting-number-formats", "not_covered"),
      state("tables-sorting-filtering", "partial"),        // mentions "table", "sort", "filter"
      state("charts", "not_covered")
    ];
    const raw = computeRawMeter(excelCriteria, blufferStates);
    // 0.2*0.5 + 0.25*0.5 + 0.15*0.5 = 0.10 + 0.125 + 0.075 = 0.30
    // raw = round(0.30 * 100) = 30
    assert.equal(raw, 30);
    assert.ok(raw < 40, `Bluffer raw meter ${raw} must be under 40`);
  });

  it("stays under 40 even with 4 partial criteria (bluffer ceiling)", () => {
    // Even if the bluffer somehow triggers partial on 4 criteria
    const blufferStates: CriterionState[] = [
      state("worksheets-workbooks-navigation", "partial"),
      state("cells-ranges-references", "partial"),
      state("formulas-functions", "partial"),
      state("formatting-number-formats", "not_covered"),
      state("tables-sorting-filtering", "partial"),
      state("charts", "not_covered")
    ];
    const raw = computeRawMeter(excelCriteria, blufferStates);
    // 0.1*0.5 + 0.2*0.5 + 0.25*0.5 + 0.15*0.5 = 0.05+0.10+0.125+0.075 = 0.35
    // raw = round(0.35 * 100) = 35
    assert.equal(raw, 35);
    assert.ok(raw < 40, `Bluffer raw meter ${raw} must be under 40`);
  });

  it("penalises bluffer who triggers wrong on misconception criteria", () => {
    const blufferStates: CriterionState[] = [
      state("worksheets-workbooks-navigation", "not_covered"),
      state("cells-ranges-references", "wrong"),        // says "$A$1 is relative"
      state("formulas-functions", "wrong"),              // says "formula starts with #"
      state("formatting-number-formats", "not_covered"),
      state("tables-sorting-filtering", "partial"),
      state("charts", "not_covered")
    ];
    const raw = computeRawMeter(excelCriteria, blufferStates);
    // base = 0.15*0.5 = 0.075
    // penalty = 0.05*0.2 + 0.05*0.25 = 0.01 + 0.0125 = 0.0225
    // raw = round((0.075 - 0.0225) * 100) = round(5.25) = 5
    assert.equal(raw, 5);
    assert.ok(raw < 40, `Bluffer raw meter ${raw} must be under 40`);
  });
});
