export type ClientIntegrationState =
  | "Configured"
  | "Mock"
  | "Link only"
  | "Not configured"
  | "Planned";

export interface ClientIntegrationItem {
  id: string;
  name: string;
  role: string;
  status: ClientIntegrationState;
  note: string;
  externalUrl?: string;
}

function readEnv(key: string): string {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.[key]?.trim() ?? "";
}

export const clientConfig = {
  apiBase: readEnv("VITE_API_URL") || "http://localhost:8787",
  trybPracticeUrl: readEnv("VITE_TRYB_PRACTICE_URL"),
  devnovateUrl: readEnv("VITE_DEVNOVATE_URL"),
  passportPublicDomain: readEnv("VITE_PASSPORT_PUBLIC_DOMAIN")
};

export function getClientIntegrations(): ClientIntegrationItem[] {
  return [
    {
      id: "elevenlabs",
      name: "ElevenLabs Voice AI",
      role: "Speech I/O and turn-taking for AI Viva",
      status: "Mock",
      note: "Scripted local voice/text simulator in MOCK_MODE=1; real adapter activates when API key and agent ID exist server-side."
    },
    {
      id: "aws_runtime",
      name: "AWS Runtime & Bedrock",
      role: "Lambda, API Gateway, DynamoDB, S3, CloudFront, Bedrock",
      status: "Mock",
      note: "Local Express API, JSON store, and deterministic scorer active in MOCK_MODE=1."
    },
    {
      id: "aws_cognito_sqs",
      name: "AWS Cognito & SQS",
      role: "Optional learner login and async validator worker",
      status: "Planned",
      note: "Planned for scale; MVP runs zero-login locally."
    },
    {
      id: "xyz_domain",
      name: ".xyz Public Passport Domain",
      role: "Public canonical URL for Skill Passports",
      status: clientConfig.passportPublicDomain ? "Configured" : "Not configured",
      note: clientConfig.passportPublicDomain
        ? `Public domain: ${clientConfig.passportPublicDomain}`
        : "Domain not configured. Using local development URL; sponsor domain allocation is not assumed."
    },
    {
      id: "tryb",
      name: "tryb Creator Studio Game",
      role: "Optional external formative practice hand-off",
      status: clientConfig.trybPracticeUrl ? "Link only" : "Not configured",
      note: "Formative practice only; no score import or credential points.",
      externalUrl: clientConfig.trybPracticeUrl || undefined
    },
    {
      id: "devnovate",
      name: "Devnovate",
      role: "Optional outbound portfolio & public opportunity link-outs",
      status: clientConfig.devnovateUrl ? "Link only" : "Not configured",
      note: "External link-out only; no automatic profile sync, SSO, or job API.",
      externalUrl: clientConfig.devnovateUrl || undefined
    },
    {
      id: "aws_sbg",
      name: "AWS Student Builder Group",
      role: "Community & student-builder sponsor",
      status: "Planned",
      note: "Community sponsor only — not a runtime API or cloud service; credits/mentors are not guaranteed."
    }
  ];
}
