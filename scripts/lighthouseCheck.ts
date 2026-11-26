import { spawnSync } from "node:child_process";

const targetUrl = process.env.LIGHTHOUSE_URL || "http://localhost:5173/";

console.log(`[lighthouse-ci] Checking ${targetUrl} (requires lighthouse CLI installed globally or via npx)`);

const result = spawnSync(
  "npx",
  [
    "--yes",
    "lighthouse",
    targetUrl,
    "--only-categories=performance,accessibility",
    "--chrome-flags=--headless --no-sandbox",
    "--output=json",
    "--quiet"
  ],
  { encoding: "utf8" }
);

if (result.status !== 0) {
  console.error("[lighthouse-ci] Lighthouse run failed or target server is not running.");
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const report = JSON.parse(result.stdout) as {
  categories?: {
    performance?: { score?: number };
    accessibility?: { score?: number };
  };
  audits?: {
    "cumulative-layout-shift"?: { numericValue?: number };
    "largest-contentful-paint"?: { numericValue?: number };
  };
};

const perf = Math.round((report.categories?.performance?.score ?? 0) * 100);
const a11y = Math.round((report.categories?.accessibility?.score ?? 0) * 100);
const cls = report.audits?.["cumulative-layout-shift"]?.numericValue ?? 0;
const lcpMs = Math.round(report.audits?.["largest-contentful-paint"]?.numericValue ?? 0);

console.log(`[lighthouse-ci] Performance=${perf}, Accessibility=${a11y}, CLS=${cls.toFixed(3)}, LCP=${lcpMs}ms`);
if (perf < 90 || a11y < 100 || cls >= 0.05) {
  process.exit(1);
}
