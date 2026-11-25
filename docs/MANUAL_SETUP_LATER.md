# Prooffolio: Manual Production Setup Checklist (Later)

> **No manual action is required to test the local `MOCK_MODE=1` path.**  
> Everything from onboarding, curated lessons, offline sync, `.xlsx` challenge upload, Python deterministic validation, AI Viva simulation, ECVE scoring, Ed25519 Skill Passport signing, and sample opportunity matching works out-of-the-box locally.

The following manual steps remain for a live cloud/production deployment:

## 1. ElevenLabs Conversational AI (Voice Layer)
- [ ] Create/configure an ElevenLabs account and Conversational AI agent using [ai-examiner-prompt.md](file:///a:/Whackiest_2k26/agent/ai-examiner-prompt.md).
- [ ] Set `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` in server-side environment/Secrets Manager.

## 2. AWS Runtime, Bedrock & Ed25519 Keys
- [ ] Provision AWS credentials and request Anthropic Claude 3.5 Sonnet model access in **Amazon Bedrock** (`ap-south-1` or configured `AWS_REGION`).
- [ ] Run `npm run deploy:build` and `npm run deploy:infra` (`sam build && sam deploy`) using [DEPLOY.md](file:///a:/Whackiest_2k26/DEPLOY.md).
- [ ] Generate a production Ed25519 keypair, store the private key in AWS Secrets Manager (`ED25519_PRIVATE_KEY_PEM`, `ED25519_KEY_ID`), and set `ED25519_PUBLIC_KEY_PEM`.
- [ ] *(Planned)* Configure AWS Cognito user pool and SQS worker if moving beyond zero-login MVP / synchronous validation.

## 3. `.xyz` Public Skill Passport Domain
- [ ] Register the `.xyz` domain.
- [ ] Request an ACM TLS certificate in `us-east-1` with DNS validation.
- [ ] Point DNS CNAME/ALIAS records to the CloudFront distribution.
- [ ] Set `PASSPORT_PUBLIC_DOMAIN`, `PASSPORT_ISSUER`, and `VITE_PASSPORT_PUBLIC_DOMAIN` to the registered domain.

## 4. Optional External Partner Link-Outs
- [ ] **tryb**: Obtain an approved Creator Studio practice game URL and set `VITE_TRYB_PRACTICE_URL` (formative practice only; no score import).
- [ ] **Devnovate**: Configure `VITE_DEVNOVATE_URL` for outbound portfolio/opportunity link-outs (no automatic profile sync or SSO).

## 5. Pilot Governance & Rubric Co-Sign
- [ ] Have vocational trainers review and co-sign [excel.json](file:///a:/Whackiest_2k26/rubrics/excel.json) and [retail_sales_cleanup.json](file:///a:/Whackiest_2k26/rubrics/retail_sales_cleanup.json) in the pilot.
- [ ] Calibrate ECVE dimension weights ($0.60P + 0.25U + 0.15C$) against empirical pilot data.
