/**
 * Viva Teach-Back — End-to-End Smoke Test
 *
 * Verifies live or staging deployment:
 * 1. GET /health
 * 2. GET /api/skills
 * 3. Run session to finish (start -> turn -> finish)
 * 4. Create and share Skill Page credential
 * 5. Fetch Skill Page at /p/{pageId}
 * 6. Verify HMAC seal at /api/verify/{pageId}
 *
 * Usage:
 *   npm run smoke -- https://your-domain.xyz
 *   npm run smoke (defaults to http://localhost:8787)
 */

interface HealthReport {
  status: string;
  mockMode: boolean;
}

interface SkillSummary {
  skill: string;
}

interface StartedSession {
  session: {
    id: string;
    skill: string;
    language: string;
  };
}

interface TurnResponse {
  understanding: number;
}

interface FinishResponse {
  id: string;
  total: number;
  overallLevel: string;
}

interface CredentialResponse {
  pageId: string;
}

interface VerifyResponse {
  valid: boolean;
  record?: {
    id: string;
    total: number;
  };
}

function parseTargetUrl(): string {
  const args = process.argv.slice(2);
  const urlArg = args.find((arg) => arg.startsWith("http://") || arg.startsWith("https://"));
  const raw = urlArg ?? args[0] ?? "http://localhost:8787";
  return raw.replace(/\/+$/, "");
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<{ status: number; data: T }> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init
  });
  const data = (await response.json()) as T;
  return { status: response.status, data };
}

async function runSmoke(): Promise<void> {
  const target = parseTargetUrl();
  const startTime = Date.now();

  console.log("=================================================");
  console.log("   Viva Teach-Back - Deployment Smoke Test       ");
  console.log("=================================================");
  console.log(`Target: ${target}\n`);

  try {
    // ─── 1. Health check ───
    process.stdout.write("[1/6] Testing GET /health... ");
    const health = await requestJson<HealthReport>(`${target}/health`);
    if (health.status !== 200) {
      throw new Error(`Health check returned status ${health.status}`);
    }
    console.log(`PASS (status: ${health.data.status ?? "ok"}, mockMode: ${health.data.mockMode})`);

    // ─── 2. Skills check ───
    process.stdout.write("[2/6] Testing GET /api/skills... ");
    const skillsRes = await requestJson<SkillSummary[]>(`${target}/api/skills`);
    if (skillsRes.status !== 200 || !Array.isArray(skillsRes.data) || skillsRes.data.length === 0) {
      throw new Error(`Skills list failed or returned empty`);
    }
    const hasExcel = skillsRes.data.some((s) => s.skill === "excel");
    if (!hasExcel) throw new Error("Excel skill missing from /api/skills");
    console.log(`PASS (${skillsRes.data.length} skills found: ${skillsRes.data.map((s) => s.skill).join(", ")})`);

    // ─── 3. Run session to finish ───
    process.stdout.write("[3/6] Running session (start -> turn -> finish)... ");
    // 3a. Start
    const startRes = await requestJson<StartedSession>(`${target}/api/session/start`, {
      method: "POST",
      body: JSON.stringify({ skill: "excel", language: "en", level: "new" })
    });
    if (startRes.status !== 201 && startRes.status !== 200) {
      throw new Error(`Session start failed with status ${startRes.status}`);
    }
    const sessionId = startRes.data.session.id;

    // 3b. Turns
    const turn1Res = await requestJson<TurnResponse>(`${target}/api/session/${sessionId}/turn`, {
      method: "POST",
      body: JSON.stringify({
        speaker: "candidate",
        text: "The SUM function adds up numbers in a range of cells, such as SUM(A1:A10)."
      })
    });
    if (turn1Res.status !== 200) {
      throw new Error(`Session turn 1 failed with status ${turn1Res.status}`);
    }

    const turn2Res = await requestJson<TurnResponse>(`${target}/api/session/${sessionId}/turn`, {
      method: "POST",
      body: JSON.stringify({
        speaker: "candidate",
        text: "When copying formulas, $A$1 is an absolute reference that stays fixed, while A1 is relative."
      })
    });
    if (turn2Res.status !== 200) {
      throw new Error(`Session turn 2 failed with status ${turn2Res.status}`);
    }

    // 3c. Finish
    const finishRes = await requestJson<FinishResponse>(`${target}/api/session/${sessionId}/finish`, {
      method: "POST"
    });
    if (finishRes.status !== 200) {
      throw new Error(`Session finish failed with status ${finishRes.status}`);
    }
    console.log(`PASS (sessionId: ${sessionId}, total: ${finishRes.data.total})`);

    // ─── 4. Create and share Skill Page credential ───
    process.stdout.write("[4/6] Creating & sharing Skill Page credential... ");
    const credRes = await requestJson<CredentialResponse>(`${target}/api/session/${sessionId}/credential`, {
      method: "POST",
      body: JSON.stringify({ name: "Smoke Test Candidate" })
    });
    if (credRes.status !== 201 && credRes.status !== 200) {
      throw new Error(`Credential creation failed with status ${credRes.status}`);
    }
    const pageId = credRes.data.pageId;

    // Make public
    const shareRes = await requestJson<{ shared: boolean }>(`${target}/api/credential/${pageId}/share`, {
      method: "PATCH"
    });
    if (shareRes.status !== 200 || !shareRes.data.shared) {
      throw new Error(`Credential share failed with status ${shareRes.status}`);
    }
    console.log(`PASS (pageId: ${pageId})`);

    // ─── 5. Fetch Skill Page at /p/{pageId} ───
    process.stdout.write(`[5/6] Fetching Skill Page at /p/${pageId}... `);
    let pageRes = await fetch(`${target}/p/${pageId}`);
    // If /p/ returned 404 in local dev or before rewrite, check fallback /pages/{pageId}/index.html
    if (!pageRes.ok) {
      pageRes = await fetch(`${target}/pages/${pageId}/index.html`);
    }
    if (!pageRes.ok) {
      throw new Error(`Failed to fetch Skill Page: HTTP ${pageRes.status}`);
    }
    const html = await pageRes.text();
    if (!html.includes("Record matches our database")) {
      throw new Error("Skill Page missing required record badge 'Record matches our database'");
    }
    console.log(`PASS (HTTP ${pageRes.status}, HTML size: ${html.length} bytes)`);

    // ─── 6. Verify endpoint ───
    process.stdout.write(`[6/6] Verifying HMAC seal via /api/verify/${pageId}... `);
    const verifyRes = await requestJson<VerifyResponse>(`${target}/api/verify/${pageId}`);
    if (verifyRes.status !== 200 || !verifyRes.data.valid) {
      throw new Error(`Verify failed: status ${verifyRes.status}, valid: ${verifyRes.data.valid}`);
    }
    console.log(`PASS (valid: true, HMAC seal verified)`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n=================================================");
    console.log(`  ALL SMOKE CHECKS PASSED (6/6 in ${elapsed}s)   `);
    console.log("=================================================\n");
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error("\n=================================================");
    console.error(`  SMOKE TEST FAILED after ${elapsed}s            `);
    console.error("=================================================");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void runSmoke();
