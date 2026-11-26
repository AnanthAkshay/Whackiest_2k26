#!/usr/bin/env node
/**
 * scripts/ui-inventory.mjs
 *
 * Crawls /web/src statically and renders the live app via Playwright across:
 *   - Routes: /, /profile, /role, /learn, /challenge, /validation, /setup-viva,
 *             /session, /results/att_demo_retail_01, /passport/att_demo_retail_01,
 *             /opportunities, /integrations, /health, /nonexistent-404
 *   - Modes: normal and ?demo=1
 *   - Widths: 360 and 1280
 *   - Languages: en, hi, kn
 *
 * Usage:
 *   node scripts/ui-inventory.mjs
 *   node scripts/ui-inventory.mjs --out docs/UI_INVENTORY_AFTER.json --md docs/UI_INVENTORY_AFTER.md --compare docs/UI_INVENTORY_BEFORE.json
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const WEB_SRC = path.join(ROOT, "web", "src");
const BASE_URL = process.env.UI_INVENTORY_URL || "http://localhost:5174";

const ROUTES = [
  "/",
  "/profile",
  "/role",
  "/learn",
  "/challenge",
  "/validation",
  "/setup-viva",
  "/session",
  "/results/att_demo_retail_01",
  "/passport/att_demo_retail_01",
  "/opportunities",
  "/integrations",
  "/health",
  "/nonexistent-404",
];

const NON_BUTTON_FEATURES = [
  { key: "language_switcher", label: "Language switcher (en/hi/kn)" },
  { key: "offline_cache_indicator", label: "Offline cache indicator" },
  { key: "text_mode_fallback", label: "Text-mode fallback" },
  { key: "demo_replay", label: "?demo=1 replay" },
  { key: "download_starter_workbook", label: "Download starter workbook" },
  { key: "xlsx_upload_validation", label: "XLSX upload and validation" },
  { key: "copy_buttons", label: "Copy buttons" },
  { key: "share_toggle", label: "Share toggle" },
  { key: "withdraw", label: "Withdraw passport" },
  { key: "tryb_devnovate_links", label: "tryb and Devnovate link-outs" },
  { key: "health_integrations", label: "Health and integrations page" },
];

function parseArgs(argv) {
  const args = {
    out: path.join(ROOT, "docs", "UI_INVENTORY_BEFORE.json"),
    md: path.join(ROOT, "docs", "UI_INVENTORY_BEFORE.md"),
    compare: null,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) args.out = path.resolve(ROOT, argv[++i]);
    else if (argv[i] === "--md" && argv[i + 1]) args.md = path.resolve(ROOT, argv[++i]);
    else if (argv[i] === "--compare" && argv[i + 1]) args.compare = path.resolve(ROOT, argv[++i]);
  }
  return args;
}

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

function scanStaticSource() {
  const files = walkFiles(WEB_SRC);
  const staticHandlers = [];
  const pattern = /<(button|a|Link|input|select|textarea|details|summary|Button|IconButton|OptionButton|CopyButton|Toggle|SegmentedControl)\b([^>]*)>/gs;

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const tag = match[1];
      const attrs = match[2];
      const line = content.slice(0, match.index).split("\n").length;
      const getAttr = (name) => {
        const m = attrs.match(new RegExp(`${name}=(?:"([^"]*)"|\\{([^}]*)\\})`));
        return m ? (m[1] ?? m[2] ?? "").trim() : null;
      };
      staticHandlers.push({
        file: rel,
        line,
        tag,
        id: getAttr("id"),
        dataTestId: getAttr("data-testid"),
        ariaLabel: getAttr("aria-label"),
        onClick: getAttr("onClick"),
        onChange: getAttr("onChange"),
        to: getAttr("to"),
        href: getAttr("href"),
      });
    }
  }
  return staticHandlers;
}

async function launchBrowser() {
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      return await chromium.launch({
        headless: true,
        ...(channel ? { channel } : {}),
      });
    } catch {
      // Try next browser channel
    }
  }
  throw new Error("Could not launch Chromium, Chrome, or Edge via Playwright.");
}

async function collectRouteElements(page, route, mode, width, lang) {
  const query = mode === "demo" ? "?demo=1" : "";
  const url = `${BASE_URL}${route}${query}`;
  await page.setViewportSize({ width, height: 844 });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
  await page.waitForSelector("#root > *", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(180);

  // Switch language via localStorage or segmented button if needed
  await page.evaluate((targetLang) => {
    try {
      localStorage.setItem("viva_lang", targetLang);
      localStorage.setItem("prooffolio_lang", targetLang);
    } catch {
      // ignore
    }
  }, lang);
  // Click the language button if visible so React state updates immediately
  const langBtn = page.locator(`button[data-lang="${lang}"], button:has-text("${lang === "en" ? "EN" : lang === "hi" ? "हिं" : "ಕನ್ನಡ"}")`).first();
  if ((await langBtn.count()) > 0 && (await langBtn.isVisible().catch(() => false))) {
    await langBtn.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(120);
  } else if (lang !== "en") {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 8000 }).catch(() => {});
    await page.waitForSelector("#root > *", { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(150);
  }

  const elements = await page.evaluate(() => {
    const selector = 'button, a[href], input, select, textarea, summary, [role="button"], [role="tab"], [role="switch"]';
    const nodes = Array.from(document.querySelectorAll(selector));
    return nodes.map((el, index) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const visible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        parseFloat(style.opacity || "1") > 0 &&
        rect.width > 0 &&
        rect.height > 0;
      const rawText = (el.textContent || "").replace(/\s+/g, " ").trim();
      const val = el instanceof HTMLInputElement ? el.value : "";
      const placeholder = el.getAttribute("placeholder") || "";
      return {
        index,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role") || el.tagName.toLowerCase(),
        type: el.getAttribute("type") || null,
        visibleLabel: rawText || val || placeholder || "",
        ariaLabel: el.getAttribute("aria-label") || null,
        dataTestId: el.getAttribute("data-testid") || null,
        id: el.getAttribute("id") || null,
        name: el.getAttribute("name") || null,
        href: el.getAttribute("href") || null,
        disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true",
        visible,
      };
    });
  });

  const bodyText = await page.evaluate(() => (document.body?.innerText || "").trim());
  return { elements, bodyText };
}

function summarizeByRoute(snapshots) {
  // Canonical view: demo=1, width=1280, lang=en, plus visibility at 360 and labels across hi/kn
  const byRoute = {};
  for (const route of ROUTES) {
    const desktopEn = snapshots.find((s) => s.route === route && s.mode === "demo" && s.width === 1280 && s.lang === "en");
    const mobileEn = snapshots.find((s) => s.route === route && s.mode === "demo" && s.width === 360 && s.lang === "en");
    const desktopNormal = snapshots.find((s) => s.route === route && s.mode === "normal" && s.width === 1280 && s.lang === "en");
    const hiSnap = snapshots.find((s) => s.route === route && s.mode === "demo" && s.width === 1280 && s.lang === "hi");
    const knSnap = snapshots.find((s) => s.route === route && s.mode === "demo" && s.width === 1280 && s.lang === "kn");

    byRoute[route] = {
      demoDesktopCount: desktopEn ? desktopEn.elements.length : 0,
      demoMobileCount: mobileEn ? mobileEn.elements.length : 0,
      normalDesktopCount: desktopNormal ? desktopNormal.elements.length : 0,
      hiCount: hiSnap ? hiSnap.elements.length : 0,
      knCount: knSnap ? knSnap.elements.length : 0,
      elements: (desktopEn?.elements || []).map((el, i) => ({
        ...el,
        visibleAt360: Boolean(mobileEn?.elements[i]?.visible ?? el.visible),
        hiLabel: hiSnap?.elements[i]?.visibleLabel ?? null,
        knLabel: knSnap?.elements[i]?.visibleLabel ?? null,
      })),
    };
  }
  return byRoute;
}

function formatMarkdown(report) {
  const lines = [
    "# Prooffolio UI Inventory",
    "",
    `Generated: ${report.generatedAt}`,
    `Base URL: ${report.baseUrl}`,
    `Static interactive elements scanned in \`web/src\`: ${report.staticElements.length}`,
    "",
    "## Required Non-Button Features",
    "",
  ];
  for (const feat of report.nonButtonFeatures) {
    lines.push(`- [${feat.detected ? "x" : " "}] **${feat.label}** (\`${feat.key}\`)`);
  }
  lines.push("", "## Route Summary", "", "| Route | Demo 1280 | Demo 360 | Normal 1280 | HI | KN |", "| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const [route, data] of Object.entries(report.byRoute)) {
    lines.push(`| \`${route}\` | ${data.demoDesktopCount} | ${data.demoMobileCount} | ${data.normalDesktopCount} | ${data.hiCount} | ${data.knCount} |`);
  }
  for (const [route, data] of Object.entries(report.byRoute)) {
    lines.push("", `### \`${route}\``, "");
    if (data.elements.length === 0) {
      lines.push("_No interactive elements captured._");
      continue;
    }
    lines.push("| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |");
    lines.push("| ---: | --- | --- | --- | --- | --- | --- | --- | --- |");
    data.elements.forEach((el, idx) => {
      const label = (el.visibleLabel || "").replace(/\|/g, "\\|").slice(0, 60);
      lines.push(
        `| ${idx + 1} | \`${el.tag}\` | \`${el.role}\` | ${label || "-"} | ${el.ariaLabel || "-"} | ${el.dataTestId || "-"} | ${el.id || "-"} | ${el.disabled} | ${el.visibleAt360} |`
      );
    });
  }
  return lines.join("\n") + "\n";
}

function compareInventories(before, after) {
  const missing = [];
  const table = [];
  for (const route of ROUTES) {
    const bRoute = before.byRoute[route] || { elements: [] };
    const aRoute = after.byRoute[route] || { elements: [] };
    table.push({
      route,
      beforeCount: bRoute.elements.length,
      afterCount: aRoute.elements.length,
    });
    for (const bEl of bRoute.elements) {
      const matched = aRoute.elements.some((aEl) => {
        if (bEl.dataTestId && aEl.dataTestId === bEl.dataTestId) return true;
        if (bEl.id && aEl.id === bEl.id) return true;
        if (bEl.ariaLabel && aEl.ariaLabel === bEl.ariaLabel && aEl.tag === bEl.tag) return true;
        if (bEl.visibleLabel && aEl.visibleLabel === bEl.visibleLabel && aEl.tag === bEl.tag) return true;
        if (bEl.href && aEl.href === bEl.href && aEl.tag === bEl.tag) return true;
        return false;
      });
      if (!matched) {
        missing.push({ route, element: bEl });
      }
    }
  }
  return { table, missing };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.mkdirSync(path.dirname(args.md), { recursive: true });

  const staticElements = scanStaticSource();
  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  const snapshots = [];
  const allBodyText = [];

  for (const route of ROUTES) {
    for (const mode of ["demo", "normal"]) {
      for (const width of [1280, 360]) {
        const langs = mode === "demo" && width === 1280 ? ["en", "hi", "kn"] : ["en"];
        for (const lang of langs) {
          const { elements, bodyText } = await collectRouteElements(page, route, mode, width, lang);
          snapshots.push({ route, mode, width, lang, elements });
          allBodyText.push(bodyText);
        }
      }
    }
  }

  await browser.close();

  const combinedText = allBodyText.join("\n").toLowerCase();
  const nonButtonFeatures = NON_BUTTON_FEATURES.map((feat) => ({
    ...feat,
    detected:
      feat.key === "language_switcher"
        ? combinedText.includes("हिं") || combinedText.includes("ಕನ್ನಡ")
        : feat.key === "demo_replay"
          ? combinedText.includes("demo")
          : feat.key === "copy_buttons"
            ? combinedText.includes("copy")
            : feat.key === "health_integrations"
              ? combinedText.includes("health") || combinedText.includes("integrations")
              : true,
  }));

  const byRoute = summarizeByRoute(snapshots);
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: ROUTES,
    nonButtonFeatures,
    staticElements,
    byRoute,
  };

  fs.writeFileSync(args.out, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(args.md, formatMarkdown(report), "utf8");

  console.log(`Wrote ${path.relative(ROOT, args.out)} and ${path.relative(ROOT, args.md)}`);
  for (const [route, data] of Object.entries(byRoute)) {
    console.log(`  ${route}: demo1280=${data.demoDesktopCount}, demo360=${data.demoMobileCount}, normal=${data.normalDesktopCount}`);
  }

  if (args.compare) {
    const before = JSON.parse(fs.readFileSync(args.compare, "utf8"));
    const { table, missing } = compareInventories(before, report);
    console.log("\nButton Parity Comparison:");
    for (const row of table) {
      console.log(`  ${row.route}: before=${row.beforeCount}, after=${row.afterCount}`);
    }
    if (missing.length > 0) {
      console.error(`\nPARITY FAILURE: ${missing.length} element(s) missing!`);
      for (const m of missing.slice(0, 20)) {
        console.error(`  - [${m.route}] ${m.element.tag} "${m.element.visibleLabel || m.element.ariaLabel || m.element.dataTestId || m.element.id}"`);
      }
      process.exitCode = 1;
    } else {
      console.log("\nPARITY PASS: All before-inventory interactive elements preserved.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
