# Prooffolio — Deployment & Manual Setup Guide

> **Local Default**: `MOCK_MODE=1` remains the zero-secret local baseline.  
> **Important**: All cloud deployment, DNS, and external provider commands below are **USER-RUN ONLY**. Do not assume sponsor credits, domain allocation, or partner APIs are active until manually configured.

---

## 1. Environment Variables Reference (Placeholders Only)

Copy `.env.example` to `.env` for local runs. Never commit `.env`, `*.pem`, `dev-keys.json`, `.data/`, or `api/.data/`.

| Variable | Example / Placeholder | Purpose |
|---|---|---|
| `MOCK_MODE` | `1` (local) / `0` (cloud) | Controls local mock path vs. real AWS & ElevenLabs |
| `PORT` | `8787` | Local Express API port |
| `VITE_API_URL` | `http://localhost:8787` or `https://api.<your-domain>` | Frontend API base URL |
| `CORS_ORIGIN` | `http://localhost:5173` or `https://<your-domain>` | Locked production origin for HTTP API CORS |
| `AWS_REGION` | `<aws-region>` (e.g. `ap-south-1`) | AWS region for Lambda, DynamoDB, S3, Bedrock |
| `BEDROCK_MODEL_ID` | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` | Bedrock model ID or inference profile ARN |
| `AWS_SESSIONS_TABLE` | `<stack-name>-sessions` | DynamoDB table for attempts, sessions, and records |
| `AWS_CREDENTIALS_TABLE` | `<stack-name>-credentials` | DynamoDB table for Skill Passports & legacy seals |
| `AWS_S3_BUCKET` | `<stack-name>-web` | Private S3 bucket for web assets, uploads, and static passports |
| `ELEVENLABS_API_KEY` | `<your-elevenlabs-api-key>` | Server-side ElevenLabs API key |
| `ELEVENLABS_AGENT_ID` | `<your-elevenlabs-agent-id>` | Configured ElevenLabs Conversational AI Agent ID |
| `ED25519_KEY_ID` | `<your-key-id>` (e.g. `prooffolio-prod-2026-1`) | Public JWKS key identifier (`kid`) |
| `ED25519_PRIVATE_KEY_PEM` | `<pkcs8-ed25519-private-pem>` | Server-side Ed25519 private signing key (Secrets Manager) |
| `ED25519_PUBLIC_KEY_PEM` | `<spki-ed25519-public-pem>` | Ed25519 public verification key |
| `PASSPORT_ISSUER` | `https://<your-registered-domain>` | Canonical `iss` claim in Skill Passport JWS |
| `PASSPORT_PUBLIC_DOMAIN` | `<your-registered-domain>` | Public host domain once registered |
| `PAGE_SECRET` | `<32+-char-random-secret>` | Legacy HMAC-SHA256 secret for backward compatibility |
| `ADMIN_KEY` | `<random-admin-secret>` | Header `X-Admin-Key` secret for `/api/admin/costs` |
| `MAX_UPLOAD_BYTES` | `10485760` | Maximum `.xlsx` upload size (10 MB) |
| `COST_CAP_INR` | `25` | Per-session cost cap in INR |
| `MAX_SESSION_DURATION_SECONDS` | `600` | Hard session duration limit (seconds) |
| `VITE_TRYB_PRACTICE_URL` | `<approved-tryb-url>` | Optional external Tryb practice link (blank until configured) |
| `VITE_DEVNOVATE_URL` | `<public-devnovate-url>` | Optional outbound Devnovate link (blank until configured) |

---

## 2. Preflight Configuration Check (Local)

Run the preflight check before building or deploying. It validates variable presence and format **without printing secret values**:

```powershell
# Validate local MOCK_MODE=1 configuration
npm run preflight

# Validate production configuration before cloud deploy (USER-RUN ONLY)
npm run preflight -- --prod
```

---

## 3. Build & Cloud Deployment Commands

### Step 3.1: Local Build & Package (Safe Local Step)
```bash
npm ci
npm run deploy:build
```

### Step 3.2: AWS SAM Build & Deploy — **USER-RUN ONLY**
```bash
cd infra
sam build --template template.yaml
sam deploy \
  --guided \
  --stack-name prooffolio-prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    BedrockModelId=<BEDROCK_MODEL_ID> \
    ElevenLabsApiKey=<ELEVENLABS_API_KEY> \
    ElevenLabsAgentId=<ELEVENLABS_AGENT_ID> \
    PageSecret=<PAGE_SECRET> \
    AdminKey=<ADMIN_KEY>
```

### Step 3.3: Web Build, S3 Sync & CloudFront Invalidation — **USER-RUN ONLY**
```bash
# Build frontend pointing to deployed API URL
VITE_API_URL=https://<api-gateway-domain> npm run build --workspace web

# Sync static bundle to S3 and invalidate CloudFront cache
aws s3 sync web/dist "s3://<WEB_BUCKET_NAME>" --delete
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_DIST_ID> --paths "/*"
```

### Step 3.4: `.xyz` Custom Domain (Only After Domain Registration) — **USER-RUN ONLY**
Do not assume a `.xyz` domain is allocated automatically. Only after you register your domain:
1. Request a public TLS certificate in **AWS Certificate Manager (ACM)** in region **`us-east-1`** (required by CloudFront) with DNS validation.
2. Add the ACM validation `CNAME` record at your domain registrar.
3. Attach the custom domain (Alternate Domain Name / CNAME) and ACM certificate to the CloudFront distribution.
4. Create a `CNAME` or Route 53 `ALIAS` record pointing your registered domain to the CloudFront distribution domain (`<dist>.cloudfront.net`).
5. Update `CORS_ORIGIN`, `PASSPORT_ISSUER`, and `PASSPORT_PUBLIC_DOMAIN` to `https://<your-registered-domain>`.

---

## 4. Manual External Provider & Sponsor Setup

### 4.1 AWS Account, Bedrock & Billing Guardrails — **USER-RUN ONLY**
1. Configure AWS CLI (`aws configure`) and SAM CLI (`sam --version`).
2. Confirm your target region (`ap-south-1` or `us-east-1`).
3. Open **Amazon Bedrock** $\rightarrow$ **Model access** and request access for Anthropic Claude 3.5 Sonnet.
4. Review `infra/template.yaml` IAM policies to ensure least-privilege access to only your stack's DynamoDB tables, S3 bucket, and Bedrock model.
5. Set **AWS Budgets / Billing Alerts** and check Lambda/Bedrock service quotas before running live traffic.

### 4.2 ElevenLabs Conversational AI Setup — **USER-RUN ONLY**
1. Create an ElevenLabs account and open the **Conversational AI** dashboard.
2. Create an Agent using [agent/ai-examiner-prompt.md](file:///a:/Whackiest_2k26/agent/ai-examiner-prompt.md) as the system prompt.
3. Copy the **Agent ID** (`ELEVENLABS_AGENT_ID`) and generate a server-side API key (`ELEVENLABS_API_KEY`).
4. Verify locally with `MOCK_MODE=0` and `GET /health` before enabling public access.

### 4.3 Optional Partner Link-Outs & Community Sponsor
- **tryb**: Create a practice activity in Tryb Creator Studio, copy its approved share URL into `VITE_TRYB_PRACTICE_URL`, and rebuild `web`. Tryb is formative practice only (no score import).
- **Devnovate**: Obtain any required partner approval and set a real public URL in `VITE_DEVNOVATE_URL`. No automatic profile sync, SSO, or job API is assumed.
- **AWS Student Builder Group**: Community/student-builder sponsor only — **not** a runtime cloud service, and credits or mentors are not guaranteed.

---

## 5. Manual Checklist for Real Provider Demo & Reviewer Calibration

When live keys and human reviewers are available:
1. **Record One Real Provider-Backed Demo**:
   - Start API with `MOCK_MODE=0` and valid ElevenLabs + AWS Bedrock credentials.
   - Run a complete session, then execute `npm run demo:record` to capture a real trace if desired.
2. **Run One Reviewer Calibration Session**:
   - Export finished sessions for human grading: `npm run reviewer:export`
   - Have an Excel-strong reviewer inspect `tests/reviewer/transcripts/*.md` and fill `tests/reviewer/sessions.csv`.
   - Compute agreement report: `npm run reviewer:compare`
   - Calibrate ECVE weights ($0.60P + 0.25U + 0.15C$) based on empirical pilot findings before claiming measured accuracy.
