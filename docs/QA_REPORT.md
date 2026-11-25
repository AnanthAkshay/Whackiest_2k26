# Prooffolio QA & Verification Report

> **Date**: 2026-11-25  
> **Mode**: `MOCK_MODE=1` (Local zero-secret baseline)  
> **Important Distinction**: All results below are **local mock and scripted unit/integration test results**. No live AWS, Amazon Bedrock, ElevenLabs, Tryb, Devnovate, or `.xyz` domain APIs were called.

---

## 1. Command & Result Summary

| Check | Command | Result | Scope & Notes |
|---|---|---|---|
| **Typecheck (Web + API)** | `npm run typecheck` | **PASS (0 errors)** | `tsc -b --pretty false` (`@viva/web`) + `tsc --noEmit` (`@viva/api`) |
| **Backend Unit, Integration & E2E Tests** | `npm test` | **PASS (76 passed, 0 failed, 1 skipped)** | Runs 17 test files sequentially (`--test-concurrency=1`), including full vertical-slice E2E, ECVE, Python validator adapter, Ed25519 JWS, IDOR, prompt injection, and opportunity matching. |
| **Frontend UI & Offline Tests** | `npm run test --workspace web` | **PASS (12 passed, 0 failed)** | SSR route rendering for all Prooffolio stages, i18n prohibited-claim checks, IndexedDB/localStorage offline queue, retry, and idempotency. |
| **Frontend Production Build** | `npm run build --workspace web` | **PASS** | `tsc -b && vite build` (`131 modules transformed`). |
| **Python Deterministic Validator** | `python -m pytest validator/tests` | **PASS (8 passed in 1.65s)** | Valid workbook, formula mismatch, duplicate row, multi-error, missing sheet, malformed workbook, unsupported formula (`unknown`/`review_required`), qualitative sort observation. |
| **Validator Fixture CLI** | `npm run validate:fixture` | **PASS (`100 / 100`, `6/6` checks)** | Generates deterministic reference `.xlsx`, validates via Python subprocess, writes `validator/sample_fact_sheet.json`. |
| **Bluff Harness (Scripted)** | `npm run test:bluff` | **PASS (63.2-pt gap, 10/10 each side)** | Scripted English transcripts only (`71.1` genuine mean vs `7.9` bluffer mean). **Not pilot data or proven cheating detection.** |
| **Local Smoke Test** | `npm run smoke -- http://localhost:8787` | **PASS (6/6 in 0.24s)** | `GET /health`, `GET /api/skills`, 2-turn session, credential creation, `/p/{pageId}` HTML fetch, `/api/verify/{pageId}` verification. |

---

## 2. Skipped Checks & Live Provider Status

| Check / Provider | Status | Reason |
|---|---|---|
| `DynamoStore.test.ts` | **SKIPPED** | `DYNAMODB_LOCAL_ENDPOINT` is not set in this local environment. |
| Live **ElevenLabs** Voice | **NOT RUN (Mocked)** | `MOCK_MODE=1`; no ElevenLabs API key or dashboard agent configured. |
| Live **AWS Bedrock** Scoring | **NOT RUN (Mocked)** | `MOCK_MODE=1`; no AWS credentials or Bedrock model access configured. |
| Live **AWS S3 / CloudFront / .xyz** | **NOT RUN (Mocked)** | No deployment executed; local `.data/` store and `localhost` URLs used. |
| **ESLint** | **NOT CONFIGURED** | Repository uses strict TypeScript (`tsc -b --pretty false` / `tsc --noEmit`) without a root ESLint config. |

---

## 3. Regressions Found & Fixed During QA
1. **LocalFileStore Concurrency**: Added an in-process async mutex in `LocalFileStore` and `--test-concurrency=1` in `api/package.json` to eliminate read-modify-write races on `.data/store.json` across test files.
2. **Viva Completion Without Transcript Retention**: Fixed `applyVivaTurnWithConsent` in `api/src/viva/examiner.ts` to track `nextTurnCount` independently of `voiceRetentionConsent` so sessions complete cleanly even when transcript retention is off.
3. **Legacy HMAC Verification Fallback**: Fixed `verifyPassportById` in `api/src/services/passportService.ts` so auto-migrated `legacy-hmac-v1` records fall through to the legacy HMAC verifier (`"legacy record-integrity check"`) rather than failing an Ed25519 consent lookup.
