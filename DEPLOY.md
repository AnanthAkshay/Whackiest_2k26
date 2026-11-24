# Prooffolio — Production Deployment Guide

This guide details the complete production deployment for Prooffolio using AWS SAM, S3, CloudFront, API Gateway, DynamoDB, and Amazon Bedrock.

---

## 1. Architecture Overview

```
                                  https://<your-domain>.xyz
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │  CloudFront Distribution  │
                              │  (ACM Cert in us-east-1)  │
                              └─────────────┬─────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
               ▼                            ▼                            ▼
        Path: /api/*                  Path: /health               Default: /* & /p/*
    ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
    │  API Gateway (HTTP)  │     │  API Gateway (HTTP)  │     │      S3 Bucket       │
    │  CORS locked to origin│    │  (Health Endpoint)   │     │  - Vite SPA Assets   │
    └──────────┬───────────┘     └──────────┬───────────┘     │  - /p/{pageId}       │
               │                            │                 │  - /audio/*.mp3      │
               ▼                            ▼                 └──────────────────────┘
    ┌───────────────────────────────────────────────────┐
    │               AWS Lambda Handlers                 │
    │  Node.js 20 on ARM64 with Least-Privilege IAM     │
    └──────────┬────────────────────────────┬───────────┘
               │                            │
               ▼                            ▼
    ┌──────────────────────┐     ┌──────────────────────┐
    │  DynamoDB Tables     │     │    Amazon Bedrock    │
    │  - Sessions          │     │  Claude 3.5 Sonnet / │
    │  - Credentials       │     │  Claude 3 Haiku      │
    └──────────────────────┘     └──────────────────────┘
```

---

## 2. Production Environment Checklist

Before running production deployment, review the following environment configuration:

| Environment Variable | Source / Value | Description |
|---|---|---|
| `MOCK_MODE` | `0` | Disables mock mode; connects to real AWS and ElevenLabs. |
| `AWS_REGION` | e.g. `ap-south-1` or `us-east-1` | AWS region where DynamoDB, S3, and Lambdas reside. |
| `AWS_SESSIONS_TABLE` | Stack output `SessionsTableName` | DynamoDB table storing session state, transcript, and cost tracker. |
| `AWS_CREDENTIALS_TABLE` | Stack output `CredentialsTableName` | DynamoDB table storing issued Skill Records and HMAC seals. |
| `AWS_S3_BUCKET` | Stack output `WebBucketName` | S3 bucket for the web app, audio cache, and Skill Pages. |
| `BEDROCK_MODEL_ID` | `us.anthropic.claude-3-5-sonnet-20241022-v2:0` | Bedrock model ID or cross-region inference profile ARN. |
| `ELEVENLABS_API_KEY` | ElevenLabs Dashboard | API key for Conversational AI and TTS audio cache. |
| `ELEVENLABS_AGENT_ID` | ElevenLabs Dashboard | Configured voice agent ID for live conversations. |
| `PAGE_SECRET` | 32+ character random string | Secret key for computing HMAC-SHA256 seals on Skill Records. |
| `ADMIN_KEY` | Random secret key | Header `X-Admin-Key` value required for `GET /api/admin/costs`. |
| `COST_CAP_INR` | `25` | Per-session cost cap in INR (default ₹25). |
| `MAX_SESSION_DURATION_SECONDS` | `600` | Hard cap duration (10 minutes). |
| `CORS_ORIGIN` | `https://<your-domain>.xyz` | **Locked to production origin**. Restricts HTTP API access to your domain. |

> [!IMPORTANT]
> **Never commit environment files with real keys.**
> Keep production secrets in AWS Systems Manager Parameter Store, AWS Secrets Manager, or pass them as secure SAM parameter overrides.

---

## 3. Step-by-Step Deployment Commands

### Step 3.1: Build API & Package Rubrics

```bash
# 1. From repository root, install clean dependencies
npm ci

# 2. Build the TypeScript API package
npm run build --workspace api

# 3. Copy rubrics into the api package so Lambda includes them in the deployment artifact
node -e "require('fs').cpSync('rubrics', 'api/rubrics', { recursive: true })"
```

### Step 3.2: Deploy Backend Infrastructure (AWS SAM)

```bash
cd infra

# Build SAM application
sam build --template template.yaml

# First-time deploy (interactive guided prompt)
sam deploy \
  --guided \
  --stack-name viva-teach-back \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    BedrockModelId=us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
    ElevenLabsApiKey=YOUR_ELEVENLABS_KEY \
    ElevenLabsAgentId=YOUR_ELEVENLABS_AGENT_ID \
    PageSecret=YOUR_RANDOM_32_CHAR_SECRET \
    AdminKey=YOUR_ADMIN_SECRET_KEY \
    CostCapInr=25 \
    MaxSessionDurationSeconds=600

cd ..
```

*For subsequent deployments, SAM uses the saved `samconfig.toml`:*
```bash
cd infra && sam build && sam deploy && cd ..
```

### Step 3.3: Pre-Generate Audio Cache (FR-33)

Generate fixed greeting and closing voice clips so live sessions play them from cache rather than generating live speech on every load:

```bash
# In production, this uploads audio/en-greeting.mp3, audio/hi-greeting.mp3, etc. directly to S3
npm run cache:audio --workspace api
```

### Step 3.4: Build & Upload the Web App

Capture stack outputs and build Vite with your live API URL:

```bash
# Extract stack outputs
STACK=viva-teach-back
WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text)
CF_DIST_ID=$(aws cloudformation describe-stacks --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
CF_URL=$(aws cloudformation describe-stacks --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text)

# Build Vite frontend targeting CloudFront URL (or your custom domain)
VITE_API_URL=$CF_URL npm run build --workspace web

# Sync web bundle to S3
aws s3 sync web/dist "s3://$WEB_BUCKET" --delete

# Invalidate CloudFront edge cache
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

---

## 4. `npm run deploy:*` Shortcut Scripts

The following scripts are defined in `package.json`:

| Command | Action |
|---|---|
| `npm run deploy:build` | Compiles API, packages rubrics, and bundles web frontend. |
| `npm run deploy:infra` | Runs `sam build` and `sam deploy` in `/infra`. |
| `npm run deploy:web` | Discovers stack outputs, syncs `web/dist` to S3, and invalidates CloudFront. |
| `npm run deploy` | Runs all three steps in sequence (`deploy:build` → `deploy:infra` → `deploy:web`). |

---

## 5. Pointing Your `.xyz` Domain to CloudFront

To host Viva Teach-Back on your custom domain (e.g. `viva.example.xyz` or `teachback.xyz`):

### Step 5.1: Request ACM Certificate in `us-east-1`

> [!WARNING]
> **CloudFront requires SSL/TLS certificates to be created in `us-east-1` (N. Virginia)**, regardless of where your other resources or Lambdas are deployed.

1. Open **AWS Certificate Manager (ACM)** in the `us-east-1` region:
   ```bash
   aws acm request-certificate \
     --region us-east-1 \
     --domain-name yourdomain.xyz \
     --subject-alternative-names "*.yourdomain.xyz" \
     --validation-method DNS
   ```
2. Retrieve the DNS validation CNAME records:
   ```bash
   aws acm describe-certificate \
     --region us-east-1 \
     --certificate-arn <CERTIFICATE_ARN> \
     --query "Certificate.DomainValidationOptions"
   ```
3. Add the `Name` and `Value` CNAME record in your DNS provider (Namecheap, Porkbun, Cloudflare, Route 53, etc.).
4. Wait for certificate status to become `ISSUED`.

### Step 5.2: Associate Custom Domain with CloudFront

In the CloudFront console or via AWS CLI:
1. Under **Distribution Settings → General → Alternate domain names (CNAMEs)**: Add `yourdomain.xyz`.
2. Under **Custom SSL certificate**: Select the ACM certificate created in `us-east-1`.
3. Save changes and wait for distribution deployment.

### Step 5.3: Add DNS Records in Your Registrar

Add the following DNS records pointing your domain to the CloudFront domain (`d111111abcdef8.cloudfront.net`):

- **If using an Apex Domain (`yourdomain.xyz`)**:
  - In **Route 53**: Create an **A record** → Alias: Yes → Target: CloudFront distribution. Add an **AAAA record** (Alias) for IPv6.
  - In **Cloudflare / DNS providers supporting CNAME flattening / ANAME**: Add an ALIAS or CNAME flattening record to `d111111abcdef8.cloudfront.net`.
- **If using a Subdomain (`viva.yourdomain.xyz`)**:
  - Add a **CNAME record**:
    - Name / Host: `viva`
    - Target: `d111111abcdef8.cloudfront.net`
    - TTL: `300` (or Auto)

---

## 6. Serving Skill Pages at `https://<domain>/p/{pageId}`

Skill Pages are standalone, static HTML credentials generated upon session completion.

### S3 & CloudFront Routing Architecture:
1. When `POST /api/session/:id/credential` is called:
   - Computes HMAC-SHA256 seal over the canonical JSON record.
   - Saves record and seal in DynamoDB `Credentials` table.
   - Uploads static HTML to S3 at:
     - `s3://<bucket>/p/<pageId>` (`ContentType: text/html; charset=utf-8`)
     - `s3://<bucket>/p/<pageId>/index.html`
     - `s3://<bucket>/pages/<pageId>/index.html`
2. When a visitor navigates to `https://<domain>/p/{pageId}`:
   - CloudFront receives the request under the default cache behavior.
   - S3 directly returns the object stored at key `p/{pageId}` with `200 OK`.
   - **Zero JavaScript execution is required** to read the Skill Page.
3. Record Integrity Verification:
   - The page includes an inline call to `GET /api/verify/{pageId}`.
   - If the stored HMAC seal matches, it displays the exact badge:
     `Record matches our database`
   - If verification fails or is unreachable, it shows "Could not check right now".
   - **Honesty Rule**: The page never states "trainer-verified", "validated", or "certified". It displays the exact `basisNote`:
     *"Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."*

---

## 7. Locking CORS to the Production Origin

To ensure backend API endpoints cannot be abused from other web origins:

1. In `api/src/config.ts`, `CORS_ORIGIN` is supplied via environment variable.
2. In `infra/template.yaml`, the HTTP API Gateway `AllowOrigins` and Lambda `CORS_ORIGIN` default to your CloudFront distribution domain:
   ```yaml
   HttpApi:
     Properties:
       CorsConfiguration:
         AllowOrigins:
           - "https://yourdomain.xyz"
         AllowMethods: [GET, POST, PATCH, DELETE, OPTIONS]
         AllowHeaders: ["Content-Type", "X-Admin-Key"]
   ```
3. When deploying with a custom domain, pass `CORS_ORIGIN=https://yourdomain.xyz` so that only browser requests from your domain are accepted.

---

## 8. Smoke Testing (`npm run smoke`)

The repository includes an end-to-end smoke test script to verify that all components of the deployment work correctly.

### Run Against Local Mock Server:
```bash
npm run smoke
```

### Run Against Live Production Domain:
```bash
npm run smoke -- https://yourdomain.xyz
```

### What the Smoke Test Verifies:
1. **`GET /health`**: Confirms health check returns HTTP 200 with operational or mock status.
2. **`GET /api/skills`**: Confirms available skills catalogue is returned (including Excel).
3. **Session Lifecycle**:
   - `POST /api/session/start`: Verifies session initialization and store persistence.
   - `POST /api/session/:id/turn`: Submits candidate explanation, validates meter evaluation.
   - `POST /api/session/:id/finish`: Finalizes scoring and computes total score.
4. **Credential & Sharing**:
   - `POST /api/session/:id/credential`: Generates unguessable `pageId` and HMAC seal.
   - `PATCH /api/credential/:pageId/share`: Makes the credential public.
5. **Skill Page Retrieval**:
   - `GET /p/{pageId}`: Fetches static HTML and confirms presence of the "Record matches our database" badge.
6. **Cryptographic Seal Integrity**:
   - `GET /api/verify/{pageId}`: Recomputes the HMAC-SHA256 seal and validates integrity (`valid: true`).

---

## 9. Tear Down / Clean Up

To delete all AWS resources and avoid ongoing charges:

```bash
# 1. Empty S3 web bucket (required before CloudFormation can delete the bucket)
STACK=viva-teach-back
WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text)
aws s3 rm "s3://$WEB_BUCKET" --recursive

# 2. Delete SAM CloudFormation stack
sam delete --stack-name $STACK
```
