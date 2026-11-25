# Prooffolio: Security, Privacy & Responsible-AI Hardening Notes

> **Disclaimer**: This document records engineering hardening controls and residual risks implemented in the Prooffolio repository. It does **not** constitute a formal third-party security audit or legal compliance certification.

---

## 1. Security & File-Safety Checklist
- [x] **Magic-Byte & Archive Validation** (`api/src/challenge/xlsxArchive.ts`): Validates ZIP local file headers (`PK\x03\x04`), central directory integrity, path traversal (`../`), and 50 MB uncompressed ZIP-bomb cap.
- [x] **Macro Rejection**: Rejects `.xlsm` files and `.xlsx` archives containing `xl/vbaProject.bin`, `vbaData.xml`, or `macroEnabled` content types. Never executes macros or workbook formulas.
- [x] **10 MB Upload Cap**: Configurable via `MAX_UPLOAD_BYTES` (default `10485760`).
- [x] **Isolated Validator Process** (`api/src/validator/pythonValidator.ts`): Runs Python `openpyxl`/`pandas` in a bounded subprocess (`15s` timeout, `2MB` stdout cap) with `data_only=False/True, keep_vba=False`.
- [x] **Spreadsheet Prompt Injection Defense** (`api/src/viva/examiner.ts`): `sanitizeUntrustedWorkbookText` and `detectPromptInjectionAttempt` neutralize control characters, `<system>`/`<instruction>` tags, and instruction-override phrases before prompt interpolation; `validateQuestionGrounding` rejects fabricated cell references.
- [x] **Private Evidence Storage**: Uploads are stored under `.data/uploads/` (git-ignored) in `MOCK_MODE=1` and private `private-uploads/` S3 prefix in cloud mode; `storageKey` is never returned in public responses or Skill Passports.
- [x] **Server-Side Secrets & CORS**: API keys, `PAGE_SECRET`, and Ed25519 private keys remain server-side; `.env` is ignored by `.gitignore`; CORS is restricted to `CORS_ORIGIN`; sessions enforce `COST_CAP_INR` and `MAX_SESSION_DURATION_SECONDS`.

---

## 2. Authorization & IDOR Prevention
- Private store getters (`getAttempt`, `getEvidenceArtifact`, `getValidationReport`, `getVivaSession`, `getAssessmentResult`, `getCredentialV2`) enforce `requestedByUserId === record.userId` and throw `UnauthorizedAccessError` on cross-learner access.
- `uploadArtifactHandler` enforces `x-user-id` / `userId` ownership on the target `AssessmentAttempt` and returns HTTP `403` on mismatch.

---

## 3. Consent, Privacy & Deletion/Export Policy
- **Granular Consent (`ConsentRecord`)**: Separates `aiProcessingConsent`, `voiceRetentionConsent` (transcripts), `rawAudioRetentionConsent` (`false` by default), and `publicSharingConsent` (`false` by default).
- **Direct Identifier Stripping**: `sanitizeForBedrockPayload` strips `userId`, `displayName`, `email`, `phone`, `coarseLocation`, and `name` before external LLM calls.
- **Immediate Share Withdrawal**: `withdrawPassportSharing` sets `publicSharingConsent: false` and logs an `AuditEvent`; public `/verify/:id` and `/api/passport/:id` immediately return `404`.
- **Deletion & Export**: Candidates can permanently delete their Skill Passport via `DELETE /api/credential/:pageId` (removing both store record and static HTML).

---

## 4. Fairness & Responsible-AI Guardrails
- **No Biometric/Accent Scoring**: AI Examiner and ECVE grade only explanation content against rubric criteria—never accent, emotion, speaking speed, or confidence.
- **ASR Confidence Fairness**: Low speech-recognition confidence (`< 0.65`) triggers transcript confirmation, inline correction, text fallback, and `Pending Human Review` rather than a knowledge penalty.
- **Honest Claims**:
  - ECVE consistency is a review signal, not proof of authorship or cheating.
  - Skill Passport Ed25519 signature + SHA-256 hash prove issuer/integrity and file binding, not authorship, trainer approval, or government accreditation.
  - Opportunity matching is decision support, not a hiring decision.
  - Rubrics are built from public sources (Microsoft MO-200 skills outline); trainer co-sign is planned for the pilot.

---

## 5. Residual / Unresolved Risks
1. **Local JSON Concurrency**: `LocalFileStore` uses single-file JSON read/write in `MOCK_MODE=1`; concurrent writes in production must use DynamoDB (`MOCK_MODE=0`) with conditional writes.
2. **Per-IP Rate Limiting**: API Gateway throttling / WAF rules must be configured in AWS SAM (`infra/template.yaml`) before public internet exposure; local Express relies on session cost/turn caps only.
3. **Authenticator / Cognito**: MVP uses zero-login quick-start; if employer/reviewer dashboards are exposed publicly, Cognito RBAC (`learner`, `reviewer`, `admin`) must be enabled.
4. **Native i18n Review**: Hindi and Kannada strings added during migration are marked in `web/src/i18n/REVIEW_NEEDED.md` for native speaker validation prior to pilot.
5. **Pilot Weight Calibration**: ECVE weights ($0.60P + 0.25U + 0.15C$) are proposed design weights requiring empirical pilot calibration.
