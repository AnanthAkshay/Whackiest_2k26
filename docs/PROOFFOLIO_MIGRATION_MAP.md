# Prooffolio Migration Map: Concept & Architecture Blueprint

> **Document Version**: 1.0.0  
> **Date**: 2026-11-25  
> **Status**: Concept, Interface, and Schema Migration Mapping  
> **Target System**: **Prooffolio** (Single unified product; voice viva is a native capability)

---

## 1. Executive Mapping Overview

This document maps every concept, data model, API endpoint, and UI route from the standalone **Viva Teach-Back** prototype to the unified **Prooffolio** platform.

**Core Vision Shift**:
- **From**: A standalone voice test evaluating theoretical spreadsheet knowledge.
- **To**: An integrated, end-to-end evidence platform where candidates **demonstrate** practical work (cleaning real retail sales spreadsheets), **explain** their reasoning to an artifact-aware AI Examiner, undergo automated **cross-verification**, receive a cryptographically signed **Skill Passport**, and **connect** to local employment opportunities.

---

## 2. Concept Mapping Table

| Legacy Concept (Viva Teach-Back) | New Prooffolio Concept | Purpose & Architectural Transformation |
|---|---|---|
| **Student Agent** (Novice persona asking to be taught) | **Prooffolio AI Examiner** | Shifts from a passive confused beginner to a professional, artifact-aware examiner who actively inspects the candidate's uploaded spreadsheet and asks targeted questions about their cleaning decisions and formulas. |
| **Session** (`Session` entity) | **AssessmentAttempt + VivaSession** | Splits monolithic session state into an overarching `AssessmentAttempt` (governing the entire 7-stage challenge journey) and a linked `VivaSession` (governing the voice turn dialogue and audio streaming). |
| **Old Rubric** (Generic MO-200 Excel outline) | **Skill Rubric & Retail Challenge Rubric** | Generic spreadsheet topics are replaced by a task-specific rubric for the **Entry-Level Data Entry Operator** role, covering date parsing, whitespace trimming, categorization, and summary aggregations. |
| **Understanding Meter** (0–100 live progress score) | **Optional Provisional Indicator** | Re-contextualized from an authoritative final exam grade to an optional, low-anxiety provisional indicator that reflects conversational dialogue flow without prematurely deciding pass/fail. |
| **Skill Page & HMAC Seal** (Single-key symmetric seal) | **Ed25519 JWS Skill Passport** | Upgrades from a symmetric HMAC-SHA256 hash (verifiable only by our server) to an asymmetric **Ed25519 JSON Web Signature (JWS)** that employers and third-party verification agents can verify offline with a public key. |
| **Generic Results** (Sub-skill points & tips) | **ECVE Result** | Restructures feedback into the four foundational pillars: **Execution** (Python check), **Comprehension** (viva dialogue), **Verification** (self-checking), and **Evidence** (direct artifact & audio citations). |
| **Old Demo** (4 setup taps into instant viva) | **Full Prooffolio Journey** | Expands onboarding into the cohesive 7-stage pipeline: `Learn` $\rightarrow$ `Practise` $\rightarrow$ `Demonstrate` $\rightarrow$ `Explain` $\rightarrow$ `Cross-Verify` $\rightarrow$ `Verify` $\rightarrow$ `Connect`. |

---

## 3. Deep-Dive Component Mappings

### 3.1 Student Agent $\rightarrow$ Prooffolio AI Examiner
* **Legacy Role**: Acted like an uninformed novice (*"I don't know what `=SUM` does, can you teach me?"*).
* **Prooffolio Role**: Acts as an **artifact-aware vocational interviewer**. The examiner receives the candidate's submitted `retail_sales_messy.xlsx` file, extracts cell coordinates, identifies formula choices, and probes the candidate on their actual work:
  > *"I see in row 12 that you converted the dates from MM/DD/YYYY to ISO standard YYYY-MM-DD. How did you handle cells with missing year values? In cell F45, why did you use `=SUM(F2:F44)` instead of calculating each subtotal individually?"*
* **Tone**: Supportive, objective, professional, and accessible in the candidate's preferred language (`en`, `hi`, `kn`).

---

### 3.2 Session $\rightarrow$ AssessmentAttempt + VivaSession
* **Legacy**: Monolithic `Session` object stored all transcript turns, meter traces, and status in one record.
* **Prooffolio**:
  - `AssessmentAttempt`: Represents the candidate's challenge progress across all 7 stages. Holds the challenge ID, role ID, uploaded artifact metadata, Python cross-verification results, and final passport ID.
  - `VivaSession`: Represents the audio interaction stream, turn transcript, audio cache hits, and turn evaluations linked by `attemptId`.

---

### 3.3 Old Rubric $\rightarrow$ Skill Rubric & Retail Challenge Rubric
* **Legacy (`rubrics/excel.json`)**: MO-200 aligned generic Excel skills:
  - Worksheets & navigation
  - Cells, ranges & references
  - Formulas & functions
  - Formatting & number formats
  - Tables, sorting & filtering
  - Charts
* **Prooffolio (`rubrics/retail_sales_cleanup.json`)**: Role-specific practical competency rubric for **Data Entry Operator**:
  - **Data Hygiene & Whitespace**: Trimming leading/trailing spaces in names and addresses (`TRIM`, clean casing).
  - **Date Normalization**: Standardizing mixed date formats (`YYYY-MM-DD`).
  - **Missing Value Handling**: Imputing default categories or flagging incomplete order entries.
  - **Summary Aggregation**: Correct formula execution for total sales revenue, average transaction value, and category item counts (`=SUM`, `=AVERAGE`, `=COUNTIF`).
  - **Quality Check & Self-Verification**: Candidate's ability to explain how they spot-checked their final figures against source data.

---

### 3.4 Understanding Meter $\rightarrow$ Optional Provisional Indicator
* **Legacy**: The meter was presented as the primary live grading indicator, causing candidate anxiety.
* **Prooffolio**:
  - The live bar is badged as a **Provisional Indicator**.
  - Candidates can toggle its visibility on/off during the voice viva.
  - Serves as reassurance that the audio is being understood, while final assessment is deferred to the holistic **ECVE** calculation.

---

### 3.5 Old Skill Page / HMAC Seal $\rightarrow$ Ed25519 JWS Skill Passport
* **Legacy**:
  - Static HTML page on S3/mock store.
  - Sealed with HMAC-SHA256 using `PAGE_SECRET`.
  - Verifiable only by calling `/api/verify/:pageId` on our backend.
* **Prooffolio**:
  - **Skill Passport**: A standardized, tamper-evident digital credential containing:
    - Candidate Nickname / ID
    - Role: Entry-Level Data Entry Operator
    - Challenge: Retail Sales Cleanup & Reporting
    - ECVE Competency Scores & Verification Timestamp
    - Artifact SHA-256 Checksum (binding the credential to the exact cleaned XLSX file)
  - **Cryptographic Seal**: Signed using **Ed25519 (Edwards-curve Digital Signature)** yielding a compact JSON Web Signature (JWS).
  - **Decentralized Verification**: Verifiers can verify the passport offline or via public JWKS endpoint (`/.well-known/jwks.json`) without trusting a centralized database call.

---

### 3.6 Generic Results $\rightarrow$ ECVE Result Framework
* **Legacy**: Total 0–100 score + sub-skill breakdown with generic study recommendations.
* **Prooffolio**:
  $$\text{ECVE Score} = w_E \cdot \text{Execution} + w_C \cdot \text{Comprehension} + w_V \cdot \text{Verification}$$
  - **E — Execution ($40\%$)**: Automated Python test suite result over the uploaded XLSX artifact.
  - **C — Comprehension ($35\%$)**: Conversational viva assessment measuring conceptual clarity.
  - **V — Verification ($15\%$)**: Candidate's self-checking methodology and ability to catch anomalies.
  - **E — Evidence ($10\%$)**: Concrete cell coordinates and formula citations captured in the dialogue.

---

### 3.7 Old 4-Step Demo $\rightarrow$ 7-Stage Prooffolio Journey

```mermaid
flowchart LR
    L["1. Learn<br/>(Micro-lessons)"] --> P["2. Practise<br/>(Drills & sandbox)"]
    P --> D["3. Demonstrate<br/>(Clean Retail XLSX)"]
    D --> E["4. Explain<br/>(Artifact-aware Viva)"]
    E --> C["5. Cross-Verify<br/>(Python Validator)"]
    C --> V["6. Verify<br/>(Ed25519 Passport)"]
    V --> Conn["7. Connect<br/>(Sample Opportunities)"]
```

1. **Learn**: Micro-lessons on data entry hygiene (text casing, date formats, formula syntax).
2. **Practise**: Quick 2-minute browser sandbox drills.
3. **Demonstrate**: Candidate downloads `retail_sales_messy.xlsx`, cleans data, and submits completed workbook.
4. **Explain**: 3-minute voice viva where the Prooffolio AI Examiner probes choices made in the uploaded file.
5. **Cross-Verify**: Automated Python validator audits the workbook against expected validation rules.
6. **Verify**: System issues the cryptographically sealed Ed25519 Skill Passport.
7. **Connect**: Candidate browses matching entry-level Data Entry Operator opportunities badged with clear sample/local tags.

---

## 4. TypeScript Data Contract Transformations

### 4.1 Legacy Model vs. Prooffolio Models

#### Legacy Schema (`api/src/types.ts`)
```typescript
// LEGACY
export interface Session {
  id: string;
  skill: string;
  language: Language;
  level: AgentLevel;
  status: SessionStatus;
  understanding: number;
  stalled: boolean;
  startedAt: string;
  updatedAt: string;
  transcript: TranscriptTurn[];
  meterTrace: MeterTraceEntry[];
}
```

#### New Prooffolio Schemas (`api/src/types.ts`)
```typescript
// PROOFFOLIO
export type JourneyStage = 
  | "learn" 
  | "practise" 
  | "demonstrate" 
  | "explain" 
  | "cross_verify" 
  | "verify" 
  | "connect";

export interface ArtifactSubmission {
  id: string;
  attemptId: string;
  filename: string;
  fileSizeBytes: number;
  sha256Hash: string;
  uploadedAt: string;
  storagePath: string; // S3 or local storage path
  parsedSummary: {
    rowCount: number;
    cleanedColumns: string[];
    detectedFormulas: string[];
    summaryTotals: Record<string, number>;
  };
}

export interface PythonValidationResult {
  passed: boolean;
  score: number; // 0 to 100
  checks: {
    ruleId: string;
    description: string;
    passed: boolean;
    details: string;
  }[];
  validatedAt: string;
}

export interface ECVEResult {
  overallScore: number;
  executionScore: number;       // Python cross-verification
  comprehensionScore: number;   // AI Examiner viva
  verificationScore: number;    // Self-checking and edge case handling
  evidenceScore: number;        // Concrete artifact citations
  feedback: {
    strengths: string[];
    improvements: string[];
  };
}

export interface AssessmentAttempt {
  id: string;
  roleId: "data-entry-operator";
  challengeId: "retail-sales-cleanup";
  language: "en" | "hi" | "kn";
  candidateName: string;
  currentStage: JourneyStage;
  submission?: ArtifactSubmission;
  validationResult?: PythonValidationResult;
  ecveResult?: ECVEResult;
  passportId?: string;
  startedAt: string;
  completedAt?: string;
}

export interface SkillPassport {
  passportId: string;
  attemptId: string;
  candidateName: string;
  role: string;
  challenge: string;
  ecveResult: ECVEResult;
  artifactHash: string;
  issuedAt: string;
  issuer: "Prooffolio";
  jwsSignature: string; // Ed25519 JWS
  publicVerificationUrl: string;
}
```

---

## 5. API Route & REST Endpoint Migration Matrix

| Legacy Endpoint | Prooffolio Endpoint | Method | Change Description |
|---|---|---|---|
| `GET /api/skills` | `GET /api/roles` | GET | Returns available vocational roles (starting with Data Entry Operator) and challenges. |
| *New* | `GET /api/challenge/:id/starter` | GET | Downloads starter dataset (`retail_sales_messy.xlsx`). |
| *New* | `POST /api/attempt/start` | POST | Initializes a new `AssessmentAttempt` starting at the `demonstrate` stage. |
| *New* | `POST /api/attempt/:id/upload` | POST | Multipart upload of the cleaned XLSX artifact; runs parser & Python validator. |
| `POST /api/session/start` | `POST /api/attempt/:id/viva/start` | POST | Starts the artifact-aware voice viva with examiner context preloaded from the artifact. |
| `POST /api/session/:id/turn` | `POST /api/attempt/:id/viva/turn` | POST | Records a candidate spoken turn, evaluates understanding, and updates provisional indicator. |
| `POST /api/session/:id/finish` | `POST /api/attempt/:id/evaluate` | POST | Synthesizes Python validation + viva scores into final ECVE result. |
| `POST /api/session/:id/credential` | `POST /api/attempt/:id/passport` | POST | Generates Ed25519 JWS signed Skill Passport and stores record. |
| `GET /api/verify/:pageId` | `GET /api/passport/verify/:id` | GET | Public verification endpoint checking the Ed25519 signature against public key. |
| *New* | `GET /api/opportunities?role=data-entry` | GET | Retrieves matching local and sample job opportunities with transparency tags. |

---

## 6. Frontend Route & Navigation Architecture Migration

| Legacy Route | Prooffolio Route | View Purpose |
|---|---|---|
| `/` | `/` | Prooffolio home: Role overview (Entry-Level Data Entry Operator) & 7-stage roadmap. |
| `/` (Step 1-4) | `/learn` & `/practise` | Learning micro-modules & interactive practice sandbox. |
| *New* | `/demonstrate` | Challenge workbench: instructions, XLSX download, and upload dropzone. |
| `/session` | `/explain` | Artifact-aware voice viva session with Prooffolio AI Examiner & provisional indicator. |
| *New* | `/cross-verify` | Automated validation report displaying Python test checkmarks. |
| `/results/:id` | `/results/:id` | Comprehensive ECVE competency breakdown with evidence links. |
| `/skill/:id` | `/passport/:id` | Official Prooffolio Skill Passport with Ed25519 badge, share sheet, and verification link. |
| *New* | `/connect` | Opportunities board displaying matched Data Entry Operator roles. |
| `/health` | `/health` | Diagnostic dashboard checking storage, validator, examiner, and voice services. |

---

## 7. Migration Safety Invariants & Deprecation Strategy

1. **Backwards Compatibility**:
   - Legacy routes (`/session`, `/results/:id`, `/skill/:id`, `/p/:pageId`) will remain wired via internal redirects so previous demo sessions never return 404.
2. **Zero Greenfield Rewrite**:
   - The React 18 frontend shell, CSS responsive design, Express wrapper, and LocalFileStore abstractions are directly reused and extended.
3. **MOCK_MODE Guarantees**:
   - All 7 stages must operate completely locally under `MOCK_MODE=1` using a mock Python validator fallback and simulated examiner responses when AWS or ElevenLabs keys are absent.
