import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "./App";
import { SetupProvider } from "./setup/SetupContext";
import { computeECVEResult, createMockValidationReport } from "./mock/demoData";
import en from "./i18n/en.json";
import hi from "./i18n/hi.json";
import kn from "./i18n/kn.json";

(globalThis as unknown as { React: typeof React }).React = React;

// Polyfill minimal window for SSR test environment
if (typeof globalThis.window === "undefined") {
  (globalThis as unknown as { window: { location: { search: string } } }).window = {
    location: { search: "" }
  };
}
if (typeof globalThis.document === "undefined") {
  (globalThis as unknown as { document: { documentElement: { lang: string } } }).document = {
    documentElement: { lang: "en" }
  };
}

function renderRoute(path: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <SetupProvider>
        <AppRoutes />
      </SetupProvider>
    </MemoryRouter>
  );
}

test("Welcome page renders Prooffolio 6-stage journey, text mode, and mock notice", () => {
  const html = renderRoute("/");
  assert.match(html, /Prooffolio/);
  assert.match(html, /1\. Learn/);
  assert.match(html, /2\. Practise/);
  assert.match(html, /3\. Demonstrate/);
  assert.match(html, /4\. Explain/);
  assert.match(html, /5\. Verify/);
  assert.match(html, /6\. Connect/);
  assert.match(html, /Text mode \(typing only\)/);
  assert.match(html, /Mock Mode/);
});

test("Learner profile, role selection, and learn & practise routes render cleanly", () => {
  const profileHtml = renderRoute("/profile");
  assert.match(profileHtml, /Use Demo Learner/);
  assert.match(profileHtml, /Display name or nickname/);

  const roleHtml = renderRoute("/role");
  assert.match(roleHtml, /Entry-Level Data Entry Operator/);

  const learnHtml = renderRoute("/learn");
  assert.match(learnHtml, /External practice activity/);
  assert.match(learnHtml, /Tryb Practice Drill/);
  assert.match(learnHtml, /Tryb game link not configured/);
  assert.match(learnHtml, /Short Practice Drills/);
  assert.match(learnHtml, /not credential evidence/);
  assert.match(learnHtml, /1\. Rows, columns/);
  assert.match(learnHtml, /7\. Building &amp; spot-checking/);
});

test("Challenge detail and validation empty state render cleanly with online-only badge", () => {
  const challengeHtml = renderRoute("/challenge");
  assert.match(challengeHtml, /Retail Sales Cleanup &amp; Reporting/);
  assert.match(challengeHtml, /\.xlsx/);
  assert.match(challengeHtml, /10 MB/);
  assert.match(challengeHtml, /Online-only/);
  assert.match(challengeHtml, /Simulated local check \(Mock Mode\)/);

  const validationEmptyHtml = renderRoute("/validation");
  assert.match(validationEmptyHtml, /No file checked yet/);
});

test("Opportunities discovery route renders sample labels, matched skills, and human agency notice", () => {
  const oppHtml = renderRoute("/opportunities");
  assert.match(oppHtml, /Sample Local Listing \(Demo\)/);
  assert.match(oppHtml, /Matched skills/);
  assert.match(oppHtml, /Skill gaps/);
  assert.match(oppHtml, /Decision support, not a job offer/);
  assert.match(oppHtml, /Use GPS location \(Optional\)/);
  assert.match(oppHtml, /never automatically applies for you or rejects you/i);
});

test("Integrations status page renders all sponsor roles and honest status badges", () => {
  const intHtml = renderRoute("/integrations");
  assert.match(intHtml, /ElevenLabs Voice AI/);
  assert.match(intHtml, /AWS Runtime &amp; Bedrock/);
  assert.match(intHtml, /\.xyz Public Passport Domain/);
  assert.match(intHtml, /Domain not configured/);
  assert.match(intHtml, /AWS Student Builder Group/);
  assert.match(intHtml, /Community sponsor only/);
});

test("createMockValidationReport distinguishes pass, issue, and not_applicable checks", () => {
  const cleaned = createMockValidationReport("retail_sales_cleaned_demo.xlsx", 42500);
  assert.equal(cleaned.isMock, true);
  assert.ok(cleaned.checks.some((c) => c.status === "pass"));
  assert.ok(cleaned.checks.some((c) => c.status === "not_applicable"));

  const uncleaned = createMockValidationReport("my_draft.xlsx", 42500);
  assert.ok(uncleaned.checks.some((c) => c.status === "issue"));
});

test("computeECVEResult calculates 0.60P + 0.25U + 0.15C and enforces review/outcome gates", () => {
  const demonstrated = computeECVEResult(90, 80, 90);
  assert.equal(demonstrated.composite, 88);
  assert.equal(demonstrated.outcome, "Demonstrated");
  assert.equal(demonstrated.criticalGatesPassed, true);

  const partial = computeECVEResult(50, 60, 80);
  assert.equal(partial.composite, 57);
  assert.equal(partial.outcome, "Partially demonstrated");

  const review = computeECVEResult(90, 80, 40);
  assert.equal(review.outcome, "Pending Human Review");
});

test("i18n dictionaries contain no prohibited claims and match keys", () => {
  const enKeys = Object.keys(en).sort();
  const hiKeys = Object.keys(hi).sort();
  const knKeys = Object.keys(kn).sort();
  assert.deepEqual(hiKeys, enKeys, "hi.json keys must match en.json");
  assert.deepEqual(knKeys, enKeys, "kn.json keys must match en.json");

  const prohibited = /(trainer-verified|government certified|cheat-proof|guaranteed job)/i;
  for (const dict of [en, hi, kn]) {
    for (const [key, val] of Object.entries(dict)) {
      assert.equal(prohibited.test(val), false, `Prohibited phrase found in i18n key ${key}`);
    }
  }
});
