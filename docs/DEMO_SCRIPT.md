# Prooffolio Demo Script (4-Minute & 6-Minute Versions)

> **Fictional Scenario**: **Meera** from **Hassan, Karnataka** (clearly labelled as a demo scenario, not live pilot data).  
> **Target Role**: Entry-Level Data Entry Operator · **Challenge**: Retail Sales Cleanup & Reporting (`.xlsx`).  
> **Mode**: `MOCK_MODE=1` (local zero-secret baseline; append `?demo=1` for deterministic replay if offline).

---

## 4-Minute Version (Tight Pitch + Live Flow)

### 0:00 – 0:45 | The Problem & Prooffolio Journey (`/`)
- **Click**: Open `http://localhost:5173` (360px mobile viewport).
- **Show**: Prooffolio landing screen (`“Work. Explain. Verify. Learn. Connect.”`) with the 6-stage journey: **Learn → Practise → Demonstrate → Explain → Verify → Connect**.
- **Say**: *"Meet Meera from Hassan. She learned Excel practically, but resumes and MCQs screen her out. Prooffolio lets her prove real work, explain it in Kannada, Hindi, or English, and earn a verifiable Skill Passport."*

### 0:45 – 1:30 | Profile, Role & Demonstrate (`/profile` → `/role` → `/challenge` → `/validation`)
- **Click**: **"Start Prooffolio Journey"** → **"Use Demo Learner (Demo Data)"** (or type `Meera`, `Hassan`, select `ಕನ್ನಡ`/`English`) → **"Continue to role selection"** → select **Entry-Level Data Entry Operator** → **"Continue to Challenge"**.
- **Click**: On `/challenge`, tap **"Load Demo Cleaned XLSX (Demo Data)"** (or upload `retail_sales_cleaned.xlsx`).
- **Show**: `/validation` report showing deterministic Python checks (`Pass`, `Issue`, `Not applicable`), SHA-256 hash, and Practical Execution score ($P$).
- **Say**: *"Objective checks run in Python code—never LLM guesses. Macros and malformed files are rejected before validation."*

### 1:30 – 2:45 | Artifact-Grounded AI Viva (`/session`)
- **Click**: **"Continue to AI Viva (Voice)"** (or **"Use text instead"**).
- **Show**: Language badge, AI Examiner asking an artifact-grounded question:
  > *"I noticed `=COUNTIF` in Summary!B5 and `=SUM` in Summary!B2. Why did you use a formula instead of typing the total?"*
- **Show**: Live transcript, **Repeat question**, inline **Correct transcript** button, and **Understanding Meter (Provisional — not final ECVE score)**.
- **Say**: *"ElevenLabs handles voice when configured; our backend owns question selection grounded strictly in the validator fact sheet. Low ASR confidence triggers confirmation, never a knowledge penalty."*

### 2:45 – 3:30 | ECVE Results & Skill Passport (`/results/:id` → `/skill/:id`)
- **Click**: **"End session"** to view ECVE Results:
  - **$P$ (Practical Execution, 60%)**, **$U$ (Conceptual Understanding, 25%)**, **$C$ (Evidence Consistency, 15%)**, **Composite**, **Critical gates**, and **Demonstrated** outcome.
- **Click**: **"Create my Skill Passport"** → `/skill/:id`.
- **Show**: Ed25519 JWS signature status, `"What this verification means"` explanation (checks issuer, signature, and status; does not prove authorship or guarantee job performance), and the exact `rubricBasis` note.

### 3:30 – 4:00 | Opportunity Discovery & Sponsor Reality (`/opportunities` → `/integrations`)
- **Click**: **"Discover matching opportunities"** → filter by `Hubballi` or `Hassan`.
- **Show**: Match % formula, matched skills, skill gaps with **"Practise now"** links, **Sample** labels, and human-agency notice (never auto-applies or auto-rejects).
- **Mention Sponsors**: ElevenLabs (voice), AWS (serverless runtime & Bedrock), `.xyz` (public domain once registered), `tryb` (external formative practice link), `Devnovate` (outbound portfolio link), and **AWS Student Builder Group** (community sponsor, not a runtime service).

---

## 6-Minute Version (Adds Learn & Practise, Offline PWA & Health Diagnostics)

Follow the 4-minute script above, plus:
- **+1:00 at `/learn` (Learn & Practise)**: Show the 7 curated MO-200-based micro-lessons, mark one complete while toggling browser Offline mode (`Offline · Cached lessons available` + `Pending Sync`), answer a formative practice drill (*"Formative practice · Not credential evidence"*), and show the **Tryb** card (`Tryb game link not configured` unless `VITE_TRYB_PRACTICE_URL` is set).
- **+1:00 at `/health` & `/integrations`**: Show live service states (`Mock`, `Live`, `Not configured`, `Planned`) and run the one-click **"Run test session"** button.

---

## Fallback Steps (If Mic / Provider / Network Fails)
1. **Microphone Blocked or Noisy Room**: Tap **"Type instead"** or **"Text mode (typing only)"** on `/` to run the entire viva by typing.
2. **Provider Unavailable (ElevenLabs / Bedrock)**: Backend automatically falls back to `MOCK_MODE=1` scripted simulator without erasing the uploaded `.xlsx` or issuing a partial credential.
3. **Complete Internet Loss**: Open `http://localhost:5173/?demo=1` to replay the pre-seeded demo (`Replay` badge shown) and view cached `/learn` lessons via Service Worker.
