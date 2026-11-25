export interface AppConfig {
  mockMode: boolean;
  port: number;
  corsOrigin: string;
  pageSecret: string;
  adminKey: string;
  costCapInr: number;
  maxSessionDurationSeconds: number;
  maxUploadBytes: number;
  awsRegion?: string;
  bedrockModelId?: string;
  sessionsTable?: string;
  credentialsTable?: string;
  s3Bucket?: string;
  elevenLabsApiKey?: string;
  elevenLabsAgentId?: string;
  localDataDirectory: string;
  passportIssuer: string;
  passportPublicDomain?: string;
  trybPracticeUrl?: string;
  devnovateUrl?: string;
  ed25519KeyId?: string;
  ed25519PrivateKeyPem?: string;
  ed25519PublicKeyPem?: string;
}

type Environment = Record<string, string | undefined>;

function requireValue(environment: Environment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name} when MOCK_MODE is off.`);
  return value;
}

export function loadConfig(environment: Environment = process.env): AppConfig {
  const mockMode = environment.MOCK_MODE !== "0";
  const baseConfig: AppConfig = {
    mockMode,
    port: Number(environment.PORT ?? 8787),
    corsOrigin: environment.CORS_ORIGIN ?? "http://localhost:5173",
    pageSecret: environment.PAGE_SECRET ?? "dev-page-secret-do-not-use-in-production",
    adminKey: environment.ADMIN_KEY ?? "dev-admin-key",
    costCapInr: Number(environment.COST_CAP_INR ?? 25),
    maxSessionDurationSeconds: Number(environment.MAX_SESSION_DURATION_SECONDS ?? 600),
    maxUploadBytes: Number(environment.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
    localDataDirectory: environment.LOCAL_DATA_DIR ?? ".data",
    passportIssuer: environment.PASSPORT_ISSUER ?? "https://prooffolio.xyz",
    passportPublicDomain: environment.PASSPORT_PUBLIC_DOMAIN?.trim() || undefined,
    trybPracticeUrl: environment.VITE_TRYB_PRACTICE_URL?.trim() || undefined,
    devnovateUrl: environment.VITE_DEVNOVATE_URL?.trim() || undefined,
    ed25519KeyId: environment.ED25519_KEY_ID?.trim() || undefined,
    ed25519PrivateKeyPem: environment.ED25519_PRIVATE_KEY_PEM?.trim() || undefined,
    ed25519PublicKeyPem: environment.ED25519_PUBLIC_KEY_PEM?.trim() || undefined
  };

  if (mockMode) return baseConfig;

  return {
    ...baseConfig,
    awsRegion: requireValue(environment, "AWS_REGION"),
    sessionsTable: requireValue(environment, "AWS_SESSIONS_TABLE"),
    credentialsTable: requireValue(environment, "AWS_CREDENTIALS_TABLE"),
    s3Bucket: requireValue(environment, "AWS_S3_BUCKET"),
    bedrockModelId: requireValue(environment, "BEDROCK_MODEL_ID"),
    pageSecret: requireValue(environment, "PAGE_SECRET"),
    elevenLabsApiKey: requireValue(environment, "ELEVENLABS_API_KEY"),
    elevenLabsAgentId: requireValue(environment, "ELEVENLABS_AGENT_ID")
  };
}

export const config = loadConfig();

export type IntegrationState = "Configured" | "Mock" | "Link only" | "Not configured" | "Planned";

export interface IntegrationStatusItem {
  id: string;
  name: string;
  role: string;
  status: IntegrationState;
  note: string;
  requiresOnline: boolean;
}

export function getIntegrationsStatus(cfg: AppConfig = config): IntegrationStatusItem[] {
  return [
    {
      id: "elevenlabs",
      name: "ElevenLabs Conversational AI",
      role: "Voice STT/TTS & turn-taking for Prooffolio AI Viva",
      status: cfg.mockMode
        ? "Mock"
        : cfg.elevenLabsApiKey && cfg.elevenLabsAgentId
        ? "Configured"
        : "Not configured",
      note: cfg.mockMode
        ? "Running scripted local voice/text simulator (no API key required)."
        : "Connected to ElevenLabs signed-URL voice endpoint.",
      requiresOnline: true
    },
    {
      id: "aws_runtime",
      name: "AWS Runtime & Bedrock (Lambda, DynamoDB, S3, CloudFront, Bedrock)",
      role: "Serverless API, persistence, static hosting, and AI Examiner reasoning",
      status: cfg.mockMode
        ? "Mock"
        : cfg.awsRegion && cfg.bedrockModelId && cfg.s3Bucket
        ? "Configured"
        : "Not configured",
      note: cfg.mockMode
        ? "Running local Express server, LocalFileStore (.data/store.json), and deterministic mock scorer."
        : "Configured for AWS serverless runtime.",
      requiresOnline: true
    },
    {
      id: "aws_cognito_sqs",
      name: "AWS Cognito & SQS Async Worker",
      role: "Optional learner authentication and asynchronous Python validation queue",
      status: "Planned",
      note: "Not required in MVP; local/mock flow runs without Cognito login.",
      requiresOnline: true
    },
    {
      id: "xyz_domain",
      name: ".xyz Public Skill Passport Domain",
      role: "Public canonical URL for verifiable Skill Passports",
      status: cfg.passportPublicDomain ? "Configured" : "Not configured",
      note: cfg.passportPublicDomain
        ? `Public domain configured: ${cfg.passportPublicDomain}`
        : "Domain not configured. Using local development URL; do not assume sponsor domain allocation.",
      requiresOnline: true
    },
    {
      id: "tryb",
      name: "tryb Creator Studio Practice Game",
      role: "Optional external formative practice hand-off",
      status: cfg.trybPracticeUrl ? "Link only" : "Not configured",
      note: cfg.trybPracticeUrl
        ? "External practice link configured. Formative practice only; no score import."
        : "Set VITE_TRYB_PRACTICE_URL to enable external link/QR.",
      requiresOnline: false
    },
    {
      id: "devnovate",
      name: "Devnovate",
      role: "Optional outbound portfolio and public opportunity link-outs",
      status: cfg.devnovateUrl ? "Link only" : "Not configured",
      note: cfg.devnovateUrl
        ? "External link-out configured. No automatic profile sync, SSO, or job API."
        : "Set VITE_DEVNOVATE_URL to enable outbound portfolio link.",
      requiresOnline: true
    },
    {
      id: "aws_sbg",
      name: "AWS Student Builder Group",
      role: "Community & student-builder sponsor",
      status: "Planned",
      note: "Community sponsor only — not a runtime API or cloud service; credits/mentors are not guaranteed.",
      requiresOnline: false
    }
  ];
}
