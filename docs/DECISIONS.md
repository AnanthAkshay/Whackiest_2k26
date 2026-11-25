# Prooffolio: Architecture Decision Records (ADR)

> **Document Version**: 1.0.0  
> **Date**: 2026-11-25  
> **Status**: Accepted & Authoritative  
> **System**: Prooffolio

This document records the architectural, algorithmic, and product policy decisions governing the Prooffolio codebase.

---

## ADR-01: Product Identity & Naming
* **Status**: Accepted
* **Context**: The project began as a hackathon prototype named "Viva Teach-Back". As the concept matured into an evidence-first, multimodal skill-to-employment platform, the identity required unification.
* **Decision**: The product name is strictly **Prooffolio**. It is not "Prooffolio 2.0" and not "Viva Teach-Back". The spoken examination capability is named **AI Viva** (conducted by the **AI Examiner**), an integrated capability within Prooffolio.
* **Consequences**: User-facing branding, page titles, navigation, and documentation reflect Prooffolio and tagline *“Work. Explain. Verify. Learn. Connect.”*. Internal low-level package names (`@viva/web`, `@viva/api`) are retained solely for build stability and compatibility.

---

## ADR-02: 7-Stage End-to-End Journey
* **Status**: Accepted
* **Context**: Vocational learners need a structured, low-anxiety path from initial skill building to employment opportunity.
* **Decision**: Standardize on a 7-stage pipeline:
  1. **Learn**: Practical micro-lessons and job expectations.
  2. **Practise**: Low-stakes interactive drills (optional tryb link-out).
  3. **Demonstrate**: Hands-on challenge task and artifact submission.
  4. **Explain**: Voice viva interview with the artifact-aware AI Examiner.
  5. **Cross-Verify**: Automated consistency check comparing spoken claims against file facts.
  6. **Verify**: Cryptographic Skill Passport issuance.
  7. **Connect**: Transparent local opportunity matching.
* **Consequences**: The UI stepper and state machine guide candidates sequentially through these stages without modal traps or forced logins.

---

## ADR-03: MVP Role, Challenge & Artifact Format
* **Status**: Accepted
* **Context**: Broad, abstract spreadsheet rubrics (e.g., general MO-200) fail to test real workplace execution.
* **Decision**:
  - **Target Role**: Entry-Level Data Entry Operator.
  - **Target Challenge**: Retail Sales Cleanup & Reporting.
  - **Artifact Format**: `.xlsx` as the primary accepted file format (CSV only if safely validated and tested).
* **Consequences**: The challenge tests concrete workplace tasks: whitespace cleanup, date normalization, missing value imputation, and summary formulas (`=SUM`, `=AVERAGE`, `=COUNTIF`).

---

## ADR-04: Deterministic Validator vs. LLM Code Inspection
* **Status**: Accepted
* **Context**: LLMs frequently hallucinate formula correctness, overlook trailing whitespace, or invent cell values.
* **Decision**: All objective spreadsheet checks must be performed by deterministic code (Python openpyxl/TS xlsx parser). The validator produces a structured, immutable **Artifact Fact Sheet** containing exact formula strings, cell values, and hygiene flags.
* **Consequences**: High reliability, zero LLM inference cost for file checks, and instant reproducibility.

---

## ADR-05: AI Viva Questioning & Application-Controlled Orchestration
* **Status**: Accepted
* **Context**: Voice agents given open-ended autonomy often drift off-topic, ask ungrounded questions, or fail to assess specific criteria.
* **Decision**:
  - **Voice Layer**: ElevenLabs provides low-latency conversational audio streaming, speech-to-text, and text-to-speech.
  - **Orchestration**: Application-controlled backend logic and Bedrock (Anthropic Claude 3.5 Sonnet) own question topic selection, grounding prompts in the **Artifact Fact Sheet** and versioned rubric.
* **Consequences**: The AI Examiner asks pointed questions about specific cells (e.g., *"Why did you use =SUM in cell F45?"*), ensuring the interview directly probes the candidate's actual work.

---

## ADR-06: ECVE Assessment Framework & Outcome Matrix
* **Status**: Accepted
* **Context**: Single-score grading obscures the distinction between someone who can write formulas versus someone who can explain their logic.
* **Decision**:
  - **Three Normalized Dimensions**:
    - **Practical Execution ($P$)** = 60%: Deterministic validator score.
    - **Conceptual Understanding ($U$)** = 25%: AI Viva comprehension evaluation.
    - **Evidence Consistency ($C$)** = 15%: Cross-verification between explanation and artifact.
    - **Composite Formula**: $\text{Composite} = 0.60P + 0.25U + 0.15C$.
    - *Notice*: Weights are proposed design values subject to pilot calibration; they are not measured accuracy.
  - **Four Authoritative Outcomes**:
    1. **Not yet demonstrated**: Composite $< 40$ or unassessable.
    2. **Partially demonstrated**: $40 \le \text{Composite} < 75$, or $\ge 75$ with any critical criterion failed.
    3. **Demonstrated**: Composite $\ge 75$, all critical criteria passed, minimum evidence satisfied, and no unresolved high-risk conflict.
    4. **Pending Human Review**: Unresolved mismatch, low transcript confidence, ambiguous evidence, or technical fault.
  - **Credential Rule**: Skill Passports are issued **only** for authoritative *Demonstrated* outcomes.
* **Consequences**: Prevents unearned credentials while providing constructive paths to improvement for partial achievers.

---

## ADR-07: Integrity Signals, Authorship Reality & Review Flagging
* **Status**: Accepted
* **Context**: AI-based proctoring systems often falsely accuse learners of fraud due to speech anxiety or accidental mistakes.
* **Decision**:
  - A mismatch between spoken explanation and file facts is treated strictly as an **audit/review signal**, **NOT** proof of cheating or malice.
  - Cryptographic hashing (SHA-256) binds a credential to the exact submitted file fingerprint; it does **not** prove biological authorship.
* **Consequences**: Candidates with discrepancies are flagged for *Pending Human Review* rather than automatically penalized or banned.

---

## ADR-08: Skill Passport Cryptography & Data Minimization
* **Status**: Accepted
* **Context**: Credentials must be tamper-evident and verifiable without creating privacy risks for vulnerable candidates.
* **Decision**:
  - **Cryptographic Seal**: Standardized JSON Web Signature (JWS) signed with an asymmetric **Ed25519** private key. Verifiers validate signatures via public keys without querying a centralized database.
  - **Privacy by Default**: Public passport pages display only consented, minimal fields (candidate handle, role, challenge, ECVE scores, timestamp, artifact SHA-256 hash, signature). Raw audio, full viva transcripts, and raw spreadsheets remain strictly private.
* **Consequences**: Tamper-proof credentials with full candidate privacy protection.

---

## ADR-09: Opportunity Matching Algorithm & Human Agency
* **Status**: Accepted
* **Context**: Algorithmic hiring systems often reject candidates opaque to scrutiny.
* **Decision**:
  - Opportunity matching evaluates **only** active skills with a *Demonstrated* outcome.
  - **Fit Algorithm**:
    $$\text{Match} = \frac{\sum (\text{weight}_i \times \text{matched}_i)}{\sum \text{weight}_i} \times 100$$
  - **Transparency**: Every match card must explicitly display matched skills, missing gaps, criteria weights, posting date, listing source, and sample vs. live status.
  - **Human Agency**: The system shall **never** automatically apply for a candidate and shall **never** automatically reject a candidate from a job feed.
* **Consequences**: Candidates maintain complete control over their job discovery process.

---

## ADR-10: Offline Capabilities & Connectivity Boundaries
* **Status**: Accepted
* **Context**: Vocational learners in low-resource settings frequently suffer intermittent internet connectivity.
* **Decision**:
  - **Offline Enabled**: Application shell, micro-lessons, challenge instructions, and practice drills are cached for offline study.
  - **Online Required**: Live AI Viva audio streaming, cloud validation, cryptographic signing, and public passport verification require active network connectivity.
* **Consequences**: Learners can study and prepare offline, connecting only for the interactive viva and verification.

---

## ADR-11: Sponsor Integration Realities & Community Clarification
* **Status**: Accepted
* **Context**: Hackathon projects must be honest about sponsor tool integration versus community affiliations.
* **Decision**:
  - **ElevenLabs**: Voice streaming, STT, and TTS provider.
  - **AWS**: Serverless runtime (Lambda, DynamoDB, S3, CloudFront) and Bedrock LLM.
  - **AWS Student Builder Group**: Documented explicitly as a community/student sponsor, **not** a cloud runtime service.
  - **.xyz Domain**: Host for public Skill Passports after registration.
  - **tryb**: Optional external practice-game link.
  - **Devnovate**: Portfolio and partner opportunity link-out.
  - *No Presumed Secret*: Real provider integrations activate only when required credentials/configuration are present; no partner APIs or credits are assumed.
* **Consequences**: Clear separation between active technical integrations, community supporters, and external partner links.

---

## ADR-12: Honesty Rule, Rubric Sourcing & Disclaimers
* **Status**: Accepted
* **Context**: Avoid misleading claims about professional or educational endorsements.
* **Decision**:
  - The spreadsheet rubric is synthesized from public sources (Microsoft MO-200 skills outline and Microsoft Support help pages).
  - It is **not** an official Microsoft certification and **not** trainer-verified.
  - Mandatory disclaimer on all Skill Passports:
    > *"Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."*
  - Public passport badge wording is strictly:
    > *"Record matches our database"*
* **Consequences**: Complete transparency for employers, candidates, and evaluators.

---

## ADR-13: Local Development Baseline (`MOCK_MODE=1`)
* **Status**: Accepted
* **Context**: Developers and evaluators need to test the entire application locally without paying for cloud resources or configuring secrets.
* **Decision**:
  - `MOCK_MODE=1` must execute the entire 7-stage flow locally.
  - Uses local JSON-file storage, deterministic mock scoring, simulated voice agent audio, and demo replay scripts.
* **Consequences**: Zero setup friction, reproducible tests, and safe local development.
