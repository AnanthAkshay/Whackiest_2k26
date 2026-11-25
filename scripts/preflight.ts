import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface PreflightResult {
  ok: boolean;
  mode: "mock" | "production";
  missingOrInvalid: string[];
  warnings: string[];
}

function parseDotEnvIfPresent(env: Record<string, string | undefined>): Record<string, string | undefined> {
  const merged = { ...env };
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return merged;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (merged[key] === undefined) {
      merged[key] = val;
    }
  }
  return merged;
}

/**
 * Validates presence and format of required configuration WITHOUT printing any secret values.
 */
export function runPreflightCheck(
  rawEnv: Record<string, string | undefined> = process.env,
  forceProd = false
): PreflightResult {
  const env = parseDotEnvIfPresent(rawEnv);
  const isProd = forceProd || env.MOCK_MODE === "0";
  const missingOrInvalid: string[] = [];
  const warnings: string[] = [];

  if (!isProd) {
    if (env.PORT && Number.isNaN(Number(env.PORT))) {
      missingOrInvalid.push("PORT (must be numeric)");
    }
    if (!env.VITE_TRYB_PRACTICE_URL?.trim()) {
      warnings.push("VITE_TRYB_PRACTICE_URL is blank (Tryb card will show 'not configured').");
    }
    if (!env.VITE_DEVNOVATE_URL?.trim()) {
      warnings.push("VITE_DEVNOVATE_URL is blank (Devnovate link-out disabled).");
    }
    return {
      ok: missingOrInvalid.length === 0,
      mode: "mock",
      missingOrInvalid,
      warnings
    };
  }

  const requiredProdVars = [
    "AWS_REGION",
    "AWS_SESSIONS_TABLE",
    "AWS_CREDENTIALS_TABLE",
    "AWS_S3_BUCKET",
    "BEDROCK_MODEL_ID",
    "ELEVENLABS_API_KEY",
    "ELEVENLABS_AGENT_ID",
    "PAGE_SECRET",
    "ED25519_KEY_ID",
    "ED25519_PRIVATE_KEY_PEM",
    "ED25519_PUBLIC_KEY_PEM",
    "CORS_ORIGIN"
  ];

  for (const key of requiredProdVars) {
    const val = env[key]?.trim();
    if (!val) {
      missingOrInvalid.push(`${key} (missing)`);
    }
  }

  if (env.PAGE_SECRET && env.PAGE_SECRET.trim().length < 32) {
    missingOrInvalid.push("PAGE_SECRET (must be at least 32 characters)");
  }

  if (env.CORS_ORIGIN && !env.CORS_ORIGIN.startsWith("https://")) {
    missingOrInvalid.push("CORS_ORIGIN (must be an https:// origin in production)");
  }

  if (!env.PASSPORT_PUBLIC_DOMAIN?.trim()) {
    warnings.push("PASSPORT_PUBLIC_DOMAIN is not set (.xyz domain not configured yet).");
  }

  return {
    ok: missingOrInvalid.length === 0,
    mode: "production",
    missingOrInvalid,
    warnings
  };
}

if (process.argv[1]?.endsWith("preflight.ts")) {
  const forceProd = process.argv.includes("--prod");
  const result = runPreflightCheck(process.env, forceProd);

  console.log("=================================================");
  console.log(`  Prooffolio Preflight Check (${result.mode.toUpperCase()})`);
  console.log("=================================================");

  for (const w of result.warnings) {
    console.log(`[WARN] ${w}`);
  }

  if (!result.ok) {
    console.error("[FAIL] Missing or invalid configuration variables (values redacted):");
    for (const item of result.missingOrInvalid) {
      console.error(`  - ${item}`);
    }
    process.exit(1);
  }

  console.log("[PASS] All required configuration variables for this mode are valid.");
}
