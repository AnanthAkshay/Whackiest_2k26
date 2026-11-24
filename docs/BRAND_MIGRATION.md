# Prooffolio Brand Migration Document

> **Document Version**: 1.0.0  
> **Date**: 2026-11-25  
> **Status**: Completed  
> **Product Name**: **Prooffolio** (Never "Prooffolio 2.0", never "Viva Teach-Back")  
> **Tagline**: **“Work. Explain. Verify. Learn. Connect.”**  
> **Feature Framing**: Voice examination is a native feature named **“AI Viva”** or **“AI Examiner”**.

---

## 1. Executive Summary

This document records the completed brand migration of the working codebase from the standalone prototype to **Prooffolio**.

The platform is positioned as:
> **An evidence-first, multilingual skill-to-employment platform. It helps learners practise, demonstrate a real task, explain their work to an AI Examiner, cross-verify the evidence, receive a verifiable Skill Passport and discover relevant opportunities.**

The conversational voice viva has been integrated as the **AI Viva** feature inside Prooffolio rather than a separate product or standalone brand.

---

## 2. Inventory of Changed Locations

The following user-facing branding, page titles, metadata, components, and documentation have been updated:

| Category | File Path | Specific Changes Made |
|---|---|---|
| **App Title & Metadata** | `web/index.html` | Updated `<title>` to `Prooffolio — Work. Explain. Verify. Learn. Connect.`; added `<meta name="description">` defining the evidence-first platform. |
| **Global Error Boundary** | `web/src/ErrorBoundary.tsx` | Replaced legacy brand header with `<p class="brand">Prooffolio</p>`. |
| **Home Screen & Journey** | `web/src/setup/SetupFlow.tsx` | Replaced legacy header with Prooffolio brand header, tagline, 6-stage journey visual stepper (`Learn` $\rightarrow$ `Practise` $\rightarrow$ `Demonstrate` $\rightarrow$ `Explain (AI Viva)` $\rightarrow$ `Verify` $\rightarrow$ `Connect`), and platform proposition card. |
| **Responsive Styling** | `web/src/styles.css` | Added styling for `.tagline`, `.journey-pill-stack`, `.journey-pill`, and `.platform-banner`. |
| **Route Architecture** | `web/src/App.tsx` | Added `/explain` (AI Viva) as an alias for `/session`, and `/passport/:id` as an alias for `/skill/:id`. |
| **English i18n Strings** | `web/src/i18n/en.json` | Updated `appName` to `"Prooffolio"`, added `tagline` & `journey` keys; rebranded "Student/confused beginner" to `"AI Examiner"`, rebranded "Skill Page" to `"Skill Passport"`, rebranded session title to `"AI Viva: Explain your work"`. |
| **Hindi i18n Strings** | `web/src/i18n/hi.json` | Updated `appName` to `"Prooffolio"`, added Hindi journey and platform banner strings; updated examiner titles and Skill Passport translations. |
| **Kannada i18n Strings** | `web/src/i18n/kn.json` | Updated `appName` to `"Prooffolio"`, added Kannada journey and platform banner strings; updated examiner titles and Skill Passport translations. |
| **Static HTML Page** | `api/src/services/skillPageHtml.ts` | Updated static HTML title and eyebrow to `"Prooffolio Skill Passport"`. |
| **Local Express API** | `api/src/local.ts` | Added `/passport/:pageId` as a route alias; updated startup console log banner to `Prooffolio mock API listening`. |
| **Deployment Smoke Test** | `scripts/smoke.ts` | Updated console header banner to `Prooffolio - Deployment Smoke Test`. |
| **Anti-Bluff Harness** | `tests/bluff/runBluffTest.ts` | Updated console header banner to `Prooffolio - Bluff Test Harness (NFR-05)`. |
| **Reviewer Check Tool** | `tests/reviewer/compareReviewerData.ts` | Updated console header banner to `Prooffolio - Early Reviewer Check Report`. |
| **Project Root Package** | `package.json` | Updated root package name from `"viva-teach-back"` to `"prooffolio"`. |
| **Project README** | `README.md` | Replaced legacy headings with `Prooffolio`, tagline, 6-stage journey, visual walkthrough screenshots, and updated architecture diagrams. |
| **Deployment Runbook** | `DEPLOY.md` | Updated title and architecture descriptions to Prooffolio. |
| **Infrastructure Docs** | `infra/README.md` | Updated title and CloudFront routing descriptions to Prooffolio. |
| **3-Minute Demo Script** | `docs/DEMO-SCRIPT.md` | Rebranded demo script, setup narrative, and AI Viva / AI Examiner interactions. |

---

## 3. Retained Compatibility Aliases

To preserve existing functionality and prevent regressions, the following compatibility aliases are retained:

1. **Frontend Route Aliases**:
   - `/session` $\rightarrow$ Retained as an alias alongside `/explain` so existing session links and bookmarks continue to function.
   - `/skill/:id` $\rightarrow$ Retained as an alias alongside `/passport/:id` so previously generated links continue to resolve.
2. **Backend Route Aliases**:
   - `GET /p/:pageId` and `GET /pages/:pageId/index.html` $\rightarrow$ Retained as aliases alongside `GET /passport/:pageId`.
3. **NPM Workspace Package Identifiers**:
   - Package names `@viva/web` and `@viva/api` inside `web/package.json` and `api/package.json` are retained internally to avoid breaking npm workspace resolution and npm scripts (`npm run typecheck --workspace web`).
4. **AWS SAM Resource Identifiers & Environment Defaults**:
   - `AWS_SESSIONS_TABLE` (default: `viva-teach-back-sessions`) and `AWS_CREDENTIALS_TABLE` (default: `viva-teach-back-credentials`) in `infra/template.yaml` and `.env.example` are retained to avoid CloudFormation stack replacement risks upon first deployment.
5. **Local Data Store**:
   - `.data/store.json` schema and existing test fixture paths remain intact.

---

## 4. Audit of Remaining Old-Name Occurrences

Every remaining occurrence of "viva" or historical terms in the codebase was audited and categorized:

| Location | Remaining Occurrence | Reason Retained |
|---|---|---|
| `AGENTS.md` | "Viva Teach-Back repository rules" | Historical rule specification file. |
| `SRS.md` & `Viva_Teach-Back_SRS (1).md` | "Viva Teach-Back SRS" | Historical requirements documentation from original sprint. |
| `Viva_Teach-Back_updated.pptx` | Presentation filename | Original ideathon presentation asset. |
| `docs/PROOFFOLIO_MIGRATION_AUDIT.md` | Comparative references | Historical migration audit document. |
| `docs/PROOFFOLIO_MIGRATION_MAP.md` | Comparative references | Concept mapping document linking old to new concepts. |
| `infra/template.yaml` | Description: "Viva Teach-Back – serverless backend..." | Internal CloudFormation template description. |
| `api/package.json` & `web/package.json` | `"name": "@viva/api"`, `"name": "@viva/web"` | Internal npm workspace package scope; renaming would break workspace links. |
| `api/src/store/DynamoStore.test.ts` | `"viva-test-sessions"` | Local test mock table names. |
| `api/src/store/LocalFileStore.test.ts` | `"viva-store-"` | Local test temp directory prefix. |
| `web/src/setup/SetupFlow.tsx` & i18n | "AI Viva" | Feature name for the conversational voice examination within Prooffolio. |

---

## 5. Verification & Test Outcomes

Following the branding migration, the full local test suite was re-executed:

```
> npm run typecheck
✔ @viva/web: tsc -b --pretty false (0 errors)
✔ @viva/api: tsc --noEmit (0 errors)

> npm test
✔ 28 passing, 0 failing, 1 skipped

> npm run test:bluff
✔ Score Gap: 63.2 points (Target >= 25 points) -> PASS
✔ Midpoint Separation: 10/10 Bluffers, 10/10 Genuine -> PASS

> npm run smoke -- http://localhost:8787
✔ [1/6] GET /health -> PASS (status: ok, mockMode: true)
✔ [2/6] GET /api/skills -> PASS (1 skill found)
✔ [3/6] Session lifecycle -> PASS (total: 33)
✔ [4/6] Passport credential creation -> PASS
✔ [5/6] Static page fetch -> PASS (HTTP 200)
✔ [6/6] Cryptographic HMAC verification -> PASS
✔ ALL SMOKE CHECKS PASSED (6/6 in 0.39s)
```
