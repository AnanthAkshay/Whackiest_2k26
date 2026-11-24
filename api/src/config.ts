export interface AppConfig {
  mockMode: boolean;
  port: number;
  corsOrigin: string;
  pageSecret: string;
  adminKey: string;
  costCapInr: number;
  maxSessionDurationSeconds: number;
  awsRegion?: string;
  bedrockModelId?: string;
  sessionsTable?: string;
  credentialsTable?: string;
  s3Bucket?: string;
  elevenLabsApiKey?: string;
  elevenLabsAgentId?: string;
  localDataDirectory: string;
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
    localDataDirectory: environment.LOCAL_DATA_DIR ?? ".data"
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
