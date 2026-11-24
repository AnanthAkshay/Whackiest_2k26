# Prooffolio Migration Audit

> **Document Version**: 1.0.0  
> **Date**: 2026-11-25  
> **Status**: Comprehensive Baseline & Technical Readiness Assessment  
> **Scope**: Transitioning the working codebase from the standalone Viva Teach-Back prototype to the unified **Prooffolio** platform.

---

## 1. Executive Summary

This document audits the existing working repository (`Whackiest_2k26`) to guide its evolution into **Prooffolio**.

**Core Principles of this Migration**:
- **Product Name**: **Prooffolio** (never "Prooffolio 2.0", never "Viva Teach-Back" in user-facing UI). The voice viva is a primary capability *inside* Prooffolio, not a separate product.
- **Product Journey**: `Learn` $\rightarrow$ `Practise` $\rightarrow$ `Demonstrate` $\rightarrow$ `Explain` $\rightarrow$ `Cross-Verify` $\rightarrow$ `Verify` $\rightarrow$ `Connect`.
- **MVP Scope**: One role (**Entry-Level Data Entry Operator**), one practical challenge (**Retail Sales Cleanup & Reporting**), XLSX-first submission, automated Python artifact validation, artifact-aware conversational viva, **ECVE** (Execution, Comprehension, Verification, Evidence) assessment, **Ed25519 JWS signed Skill Passport**, and clearly labelled sample/local opportunity matching.
- **Environment Reality**: The codebase runs end-to-end under `MOCK_MODE=1`. No AWS credentials, ElevenLabs keys, Bedrock model access, or `.xyz` domain registrations have been deployed to external clouds yet.

---

## 2. Existing Feature Inventory (What Works Today in MOCK_MODE)

The existing repository is fully functional locally without cloud keys or external paid dependencies:

| Subsystem | Existing Working Capability | Implementation Status | Test / Verification Coverage |
|---|---|---|---|
| **Frontend Setup Flow** | Single-tap 4-step setup (Skill, Language, Level, Consent) | **Working** (`SetupFlow.tsx`) | Typechecked, responsive at 360px |
| **Multilingual Engine** | First-class English (`en`), Hindi (`hi`), and Kannada (`kn`) translations | **Working** (`i18n.tsx`, `en.json`, `hi.json`, `kn.json`) | All keys populated, zero missing |
| **Conversational Voice UI** | Turn-taking dialogue, speech bubble transcript, live audio indicators | **Working** (`SessionPage.tsx`, browser speech API fallback) | Smoke test verified |
| **Understanding Meter** | Non-linear rubric coverage calculation with smoothing (max 10-pt drop) | **Working** (`meter.ts`, `MeterBar.tsx`) | 16 unit tests in `meter.test.ts` |
| **Conversational Stall Detection** | Detects repetitive or non-advancing candidate turns and prompts follow-up probes | **Working** (`meter.ts`) | Tested in `meter.test.ts` |
| **Deterministic Scorer** | Regex/keyword evaluation grading sub-skills, awarding 0/50/100 and generating tips | **Working** (`MockScorer.ts`) | Evaluated in `evalFixtures.ts` |
| **Local Store** | File-backed JSON database for sessions, credentials, and meter traces | **Working** (`LocalFileStore.ts` $\rightarrow$ `.data/store.json`) | Integration tested |
| **DynamoDB Store** | AWS SDK v3 DynamoDB implementation passing identical interface | **Implemented** (`DynamoStore.ts`) | Unit test ready (skips if local endpoint unset) |
| **Skill Page Generator** | Server-side static HTML builder with inline CSS and zero JavaScript reading requirements | **Working** (`skillPageHtml.ts`, `credential.ts`) | Verified via smoke test |
| **Cryptographic Seal Check** | HMAC-SHA256 seal computation over canonical JSON; verification endpoint | **Working** (`seal.ts`, `verify.ts`) | Verified via smoke test |
| **Cost Tracking & Cap** | INR token & voice second tracking with ₹25 hard session cap and admin endpoint | **Working** (`pricing.ts`, `admin.ts`, `cost.md`) | Verified via smoke test |
| **Audio Caching** | Fixed greeting/closing audio cache generation for ElevenLabs TTS | **Working** (`audioCache.ts`, `generateAudioCache.ts`) | Pre-generated audio files in `web/public/audio` |
| **Demo Safety Modes** | Deterministic `?demo=1` replay, Text Mode typing fallback, `/health` dashboard | **Working** (`HealthPage.tsx`, `ErrorBoundary.tsx`) | Automated in smoke test |
| **Anti-Bluff Harness (NFR-05)** | 20-transcript benchmark evaluating jargon suppression vs. concrete syntax | **Working** (`runBluffTest.ts`) | 63.2-pt score gap (PASS) |
| **Early Reviewer Tooling** | CSV export of finished sessions and comparison of human reviewer ratings | **Working** (`exportReviewerData.ts`, `compareReviewerData.ts`) | Evaluated on 5 sessions, 100% agreement $\le 10$ pts |

---

## 3. Reusable Files and Architectural Modules

A large proportion of the codebase can be directly carried forward or cleanly refactored for Prooffolio:

```
Whackiest_2k26/
├── web/src/
│   ├── ErrorBoundary.tsx             --> [DIRECT REUSE] Global UI safety
│   ├── health/HealthPage.tsx         --> [DIRECT REUSE] Diagnostics dashboard
│   ├── i18n/ (en, hi, kn)            --> [REFINE] Rebrand strings to Prooffolio; add 7-stage keys
│   ├── session/MeterBar.tsx          --> [ADAPT] Adapt to optional provisional viva indicator
│   ├── shared/ScoreList.tsx          --> [ADAPT] Adapt to ECVE 4-quadrant display
│   ├── shared/Sparkline.tsx          --> [DIRECT REUSE] Viva progress visualization
│   └── styles.css                    --> [EXPAND] 360px mobile-first responsive foundation
├── api/src/
│   ├── config.ts                     --> [EXPAND] Add Prooffolio & Ed25519 environment flags
│   ├── logger.ts                     --> [DIRECT REUSE] Structured JSON event logging
│   ├── meter.ts                      --> [DIRECT REUSE] Smoothing and stall detection algorithm
│   ├── pricing.ts                    --> [DIRECT REUSE] Token and duration tracking in INR
│   ├── services/audioCache.ts        --> [DIRECT REUSE] Pre-cached audio CDN delivery
│   ├── store/Store.ts                --> [EXPAND] Add Challenge, Submission, and Passport models
│   ├── store/LocalFileStore.ts       --> [EXPAND] Local JSON store for Prooffolio models
│   ├── store/DynamoStore.ts          --> [EXPAND] DynamoDB mapping for Prooffolio entities
│   ├── handlers/health.ts            --> [DIRECT REUSE] Service diagnostic handler
│   └── handlers/admin.ts             --> [DIRECT REUSE] Cost reporting API
├── infra/
│   ├── template.yaml                 --> [ADAPT] Update table definitions & add artifact S3 prefix
│   └── README.md                     --> [DIRECT REUSE] AWS SAM deployment runbook
└── scripts/
    ├── smoke.ts                      --> [EXPAND] Expand smoke test across all 7 stages
    └── captureScreenshots.ts         --> [DIRECT REUSE] Chrome headless screenshot automation
```

---

## 4. Missing Prooffolio Capabilities (Gap Analysis)

To fulfill the Prooffolio specification, the following capabilities must be created:

### 4.1 The 7-Stage Candidate Journey Flow
Currently, the UI is restricted to Setup $\rightarrow$ Viva $\rightarrow$ Results $\rightarrow$ Skill Page. Prooffolio requires explicit navigation across all 7 stages:
1. **Learn**: Short, digestible micro-lessons for the Entry-Level Data Entry Operator role (e.g., date normalization, text trimming, deduplication, `=SUM` / `=AVERAGE` formula hygiene).
2. **Practise**: Interactive sandboxed exercises where candidates try data cleaning tasks with immediate hints.
3. **Demonstrate (The Retail Challenge)**:
   - Downloadable messy starter XLSX dataset (`retail_sales_messy.xlsx` with whitespace anomalies, non-standard date formats, missing product categories, and uncalculated totals).
   - Candidate cleans the file locally or in browser, adds required summary formulas, and uploads the completed `.xlsx` file.
   - File upload handler with validation (MIME-type check, size cap $\le 5$ MB).
4. **Explain (Artifact-Aware Voice Viva)**:
   - The AI Examiner must ingest the candidate's actual uploaded spreadsheet data before the viva begins.
   - Dynamic examiner prompts focused on the candidate's submitted work (e.g., *"In row 24, why did you choose the format YYYY-MM-DD? Talk me through how you calculated the total sales in cell G45."*).
5. **Cross-Verify (Automated Python Validator)**:
   - Deterministic Python validation script (`validate_retail_challenge.py`) that checks the submitted XLSX artifact:
     - Exact row count and column presence
     - Stripped leading/trailing whitespace in customer names
     - ISO 8601 standardized dates
     - Presence of actual formulas (`=SUM(...)`, not hardcoded values)
     - Accurate summary statistics
   - Yields a structured execution score with itemized checks.
6. **Verify (Ed25519 JWS Signed Skill Passport)**:
   - Replacement of the single-key HMAC-SHA256 seal with an **Ed25519 asymmetric keypair**.
   - Generates a **JSON Web Signature (JWS)** representing the Skill Passport.
   - Anyone can verify the passport using the public key without possessing the signing secret.
7. **Connect (Local & Sample Opportunities)**:
   - Opportunity board displaying realistic local entry-level Data Entry Operator roles.
   - **Honesty Guardrail**: Each opportunity must be prominently badged as `[Sample Opportunity]` or `[Local Partner Pilot]` to prevent deceptive employment claims.

### 4.2 ECVE Assessment Framework
The scoring model must evolve from 6 generic Excel sub-skills into the **ECVE** matrix:
- **E — Execution**: Did the candidate produce clean, correct spreadsheet data? (Derived from Python cross-verification).
- **C — Comprehension**: Does the candidate understand the principles behind their actions? (Derived from voice viva).
- **V — Verification**: Did the candidate check their own work and catch edge cases? (Derived from viva probes).
- **E — Evidence**: Concrete citations from both the submitted artifact and spoken explanation.

---

## 5. Breaking-Change Risks & Architectural Debt

| Risk Area | Severity | Impact Description | Mitigation Strategy |
|---|---|---|---|
| **Route Collisions** | High | `/session` currently assumes immediate voice viva without previous artifact demonstration. | Refactor `/session` into stage-aware routes: `/challenge`, `/viva`, `/passport`. Maintain backwards compatibility redirects. |
| **Schema Evolution** | High | `SkillRecord` in `store.json` only holds viva totals. Lacks artifact submission, Python validation results, and Ed25519 JWS signatures. | Introduce new unified entities: `AssessmentAttempt`, `ArtifactSubmission`, `ECVEResult`, and `SkillPassport`. Maintain compatibility for legacy viva records. |
| **Examiner Prompt Ingestion** | Medium | Current `prompts.ts` hardcodes static beginner questions. | Implement an artifact parser that extracts summary statistics from the candidate's XLSX and injects them into the examiner prompt variables. |
| **Python Execution in Serverless** | Medium | AWS Lambda Node.js runtime does not natively bundle Python 3. | For local mock mode, execute Python via child process; for AWS Lambda, containerize or invoke a lightweight JS/TS XLSX validation parser with Python parity. |
| **Ed25519 Key Management** | Low | Old HMAC used symmetric `PAGE_SECRET`. | Use Node 20 `crypto.generateKeyPairSync('ed25519')` and export public keys via JWKS endpoint (`/.well-known/jwks.json`). |

---

## 6. Current Test, Typecheck, and Verification Status

All local quality gates pass with zero errors:

```
> npm run typecheck
✔ Web workspace (tsc -b): 0 errors
✔ API workspace (tsc --noEmit): 0 errors

> npm test
✔ 28 passing, 0 failing, 1 skipped (DynamoDB local endpoint)
✔ meter.test.ts: 16 test cases passing
✔ LocalFileStore.test.ts: persistence verified
✔ rubric.test.ts: rubric validation verified

> npm run test:bluff
✔ Score Gap: 63.2 points (Requirement: >= 25 points) -> PASS
✔ Midpoint Separation: 10/10 Bluffers <= 39.5, 10/10 Genuine >= 39.5 -> PASS

> npm run reviewer:compare
✔ Evaluated Sessions: 5 sessions
✔ Mean Absolute Difference: 2.80 points
✔ Agreement within 10 points: 5 / 5 (100.0%)
```

---

## 7. Integration Status: Implemented vs. Mocked vs. Configured vs. Deployed

| Service / Integration | Code Status | Runtime Status | Configuration Needed for Production |
|---|---|---|---|
| **Local Mock Engine** | Implemented | **Active** (`MOCK_MODE=1`) | None (works out of the box) |
| **Browser Speech STT/TTS** | Implemented | **Active** (Native Web Audio) | None |
| **ElevenLabs Conversational AI** | Implemented (`ElevenLabsAgent.ts`) | **Mocked** | Requires `ELEVENLABS_API_KEY` & `ELEVENLABS_AGENT_ID` |
| **AWS Bedrock (Claude 3.5 Sonnet)** | Implemented (`BedrockScorer.ts`) | **Mocked** | Requires AWS credentials & `BEDROCK_MODEL_ID` |
| **AWS DynamoDB** | Implemented (`DynamoStore.ts`) | **Mocked** (uses `LocalFileStore`) | Requires AWS IAM role & SAM deployment |
| **Amazon S3 & CloudFront** | Configured in SAM | **Not Deployed** (uses `web/public`) | Requires AWS deployment |
| **Custom .xyz Domain** | Documented in `DEPLOY.md` | **Unregistered / Not Configured** | Requires purchasing domain & ACM cert |
| **Python XLSX Validator** | Planned | **Not Implemented** | Requires `scripts/validate_retail_challenge.py` |
| **Ed25519 JWS Issuer** | Planned | **Not Implemented** (currently HMAC) | Requires keypair generator & JWS encoder |

---

## 8. Missing Secrets and Manual Setup Checklist

The following items are completely unconfigured in the current environment (as expected for mock development):
- [ ] `ELEVENLABS_API_KEY`: Missing (running mock voice).
- [ ] `ELEVENLABS_AGENT_ID`: Missing (running mock agent).
- [ ] AWS Credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`): Missing (running local file store).
- [ ] AWS Bedrock Model Access: Unconfigured.
- [ ] `.xyz` Domain: Unpurchased / unmapped.
- [ ] CloudFront SSL/TLS Certificate in `us-east-1`: Unprovisioned.

---

## 9. Recommended Ordered Migration Plan

To safely migrate this codebase without breaking working functionality, execute the following staged phases:

### Phase 1: Branding & Journey Shell (Non-Breaking)
1. Rebrand user-facing strings across `en.json`, `hi.json`, and `kn.json` from "Viva Teach-Back" to **Prooffolio**.
2. Establish the 7-stage navigation stepper in the UI: `Learn` $\rightarrow$ `Practise` $\rightarrow$ `Demonstrate` $\rightarrow$ `Explain` $\rightarrow$ `Cross-Verify` $\rightarrow$ `Verify` $\rightarrow$ `Connect`.
3. Add placeholder route views for the new stages while keeping the existing viva operational at the `Explain` stage.

### Phase 2: Role, Challenge & Demonstration Stage (XLSX)
1. Define the role: **Entry-Level Data Entry Operator**.
2. Create the practical challenge: **Retail Sales Cleanup & Reporting**.
3. Generate starter dataset: `web/public/challenges/retail_sales_messy.xlsx`.
4. Build the file upload & parser component in `web/src/demonstrate/` and API endpoint `POST /api/challenge/submit`.

### Phase 3: Cross-Verification Engine (Python Validator)
1. Write `scripts/validate_retail_challenge.py` (and TypeScript validator mirror) checking data hygiene, normalization, and formula syntax.
2. Hook validator output into the execution score ($E$ in ECVE).

### Phase 4: Artifact-Aware AI Examiner (Explain Stage)
1. Upgrade `prompts.ts` from generic Excel questions to examine the candidate's actual submitted workbook.
2. Feed candidate submission summary metrics directly into the examiner context.
3. Reposition the Understanding Meter as an optional provisional feedback bar.

### Phase 5: ECVE Scoring & Skill Passport (Verify Stage)
1. Implement the ECVE scoring aggregator combining Python execution metrics with viva comprehension scores.
2. Implement Ed25519 keypair generation and JWS passport signing (`src/services/passport.ts`).
3. Build the public Skill Passport view (`/passport/:passportId`) with offline cryptographic verification.

### Phase 6: Opportunities & Connection (Connect Stage)
1. Implement the local opportunities board with clearly badged sample/partner listings.
2. Provide a one-click "Apply with Skill Passport" flow demonstrating end-to-end value.
3. Update smoke tests, demo scripts, and documentation.
