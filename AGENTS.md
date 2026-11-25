# Prooffolio Repository Rules

## 1. Product Identity & Core Mission
- Product name: **Prooffolio** (strictly this; never "Prooffolio 2.0" and never "Viva Teach-Back" in user-facing copy or new code).
- Tagline: *“Work. Explain. Verify. Learn. Connect.”*
- Positioning: An evidence-first, multilingual skill-to-employment platform helping informal learners and vocational graduates demonstrate real skills, explain their reasoning, cross-verify evidence, earn verifiable Skill Passports, and discover local opportunities.
- The voice interview capability is the **AI Viva** (conducted by the **AI Examiner**), an integrated capability within Prooffolio, not a separate standalone product.

## 2. End-to-End Candidate Journey
The candidate flows through 7 cohesive stages:
1. **Learn**: Practical micro-lessons for entry-level digital roles.
2. **Practise**: Low-stakes interactive drills and exercises (optional tryb external link).
3. **Demonstrate**: Complete a realistic workplace challenge (MVP: Retail Sales Cleanup & Reporting) and submit work (primary: XLSX; CSV only if safely tested).
4. **Explain**: Voice viva interview where an artifact-aware AI Examiner probes the candidate on their actual submitted file.
5. **Cross-Verify**: Automated consistency check comparing viva claims against deterministic file facts.
6. **Verify**: Cryptographically signed Skill Passport issuance (Ed25519 JWS) bound to the artifact SHA-256 fingerprint.
7. **Connect**: Transparent opportunity discovery and matching with local entry-level employers.

## 3. MVP Scope
- **Target Role**: Entry-Level Data Entry Operator.
- **Target Challenge**: Retail Sales Cleanup & Reporting.
- **Artifact Handling**: XLSX is the primary accepted file format (CSV only if already safely supported and tested).
- **Deterministic Validation**: Code-based spreadsheet validator produces a structured fact sheet checking objective rules defined by a versioned challenge rubric. Objective checks use code, never LLM guesses.
- **AI Viva Questioning**: Grounded in the challenge rubric and verified artifact facts. ElevenLabs provides the voice layer; application-controlled backend logic and Bedrock own question selection and scoring.

## 4. ECVE Assessment Framework & Outcome Matrix
- **Tri-Pillar Normalized Dimensions**:
  - **P (Practical Execution)** = 60% (from deterministic spreadsheet validator).
  - **U (Conceptual Understanding)** = 25% (from AI viva comprehension evaluation).
  - **C (Evidence Consistency)** = 15% (from cross-verifying candidate explanation against artifact facts).
  - **Composite Formula**: $\text{Composite} = 0.60P + 0.25U + 0.15C$.
  - *Calibration Notice*: Weights are proposed and must be calibrated in empirical pilots; they are not measured accuracy.
- **Four Distinct Outcomes**:
  - **Not yet demonstrated**: Score $< 40$ or unassessable after review.
  - **Partially demonstrated**: $40 \le \text{Score} < 75$, or $\ge 75$ with any critical criterion failed.
  - **Demonstrated**: $\ge 75$, all critical criteria passed, minimum evidence met, and no unresolved high-risk conflict.
  - **Pending Human Review**: Unresolved mismatch between explanation and artifact, low transcript confidence, ambiguous evidence, technical fairness issue, or learner dispute.
  - **Credential Rule**: Skill Passport credentials are issued **only** for authoritative *Demonstrated* outcomes.

## 5. Integrity, Authorship & Privacy Guardrails
- **Integrity Signal Principle**: A mismatch between spoken claims and spreadsheet facts is an audit/review signal, **NOT** proof of cheating or authorship.
- **Artifact Binding**: SHA-256 binds the credential to the submitted file fingerprint; it does **not** prove who created the file.
- **Skill Passport Cryptography**: Ed25519-signed JSON Web Signature (JWS) embedding the artifact SHA-256 fingerprint.
- **Privacy by Default**: Public Skill Passport pages expose only consented, minimal fields (candidate handle, role, challenge, ECVE scores, timestamp, signature, artifact hash). Submitted evidence files, raw voice audio, and full viva transcripts remain strictly private by default.

## 6. Opportunity Matching Algorithm
- Evaluates **only** active *Demonstrated* skills.
- **Matching Formula**:
  $$\text{Match} = \frac{\sum (\text{weight}_i \times \text{matched}_i)}{\sum \text{weight}_i} \times 100$$
- **Explainability**: Every match card must explicitly display matched skills, skill gaps, requirement weights, opportunity source, posted date, and whether the opportunity is sample or live.
- **Human Agency**: Never automatically apply for a candidate and never automatically reject a candidate.

## 7. Connectivity & Offline Boundaries
- **Offline Mode**: Cached app shell, micro-lessons, practice drills, and queued eligible offline actions.
- **Online Requirements**: Live AI Viva audio streaming, cloud validation, cryptographic signing, and public passport verification require active connectivity.

## 8. Sponsor Ecosystem & Integration Realities
- **ElevenLabs**: Voice streaming, STT, and TTS layer.
- **AWS**: Serverless runtime (Lambda, DynamoDB, S3, CloudFront) and Bedrock LLM.
  - *Note*: AWS Student Builder Group is a community sponsor, not a cloud runtime service.
- **.xyz Domain**: Public host for verifiable Skill Passports after custom domain registration.
- **tryb**: Optional external practice-game link-out.
- **Devnovate**: Portfolio and opportunity link-outs.
- *Strict Rule*: Do not assume partner APIs, credits, or domain allocation until explicitly configured.

## 9. Honesty & Disclosure Rules
- **No Trainer Rule**: The spreadsheet rubric is built from public sources (Microsoft MO-200 skills outline and Microsoft Support help pages). It is **not** an official Microsoft certification and **not** trainer-verified.
- **Prohibited Words**: Never write "trainer-verified", "validated", "certified", "100% accurate", "cheat-proof", "guaranteed job", or cite uncalibrated agreement percentages.
- **Mandatory i18n Key (`rubricBasis`)**: Must exist in English, Hindi, and Kannada:
  > *"Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."*
- **Database Match Badge**: On a Skill Passport page, a record-match badge means only that the page matches our stored record. Its wording is exactly:
  > *"Record matches our database"*

## 10. Engineering & Operational Guardrails
- **Mobile-First UI**: Primary target is a 360px-wide viewport.
- **Zero Friction**: No login and no typing in the main candidate flow (quick-start with handle/contact).
- **Environment Configuration**: List every environment variable in `.env.example`; never commit `.env` or files containing secrets. Real secrets remain server-side.
- **Local MOCK_MODE=1**: Must run the entire app locally without AWS or ElevenLabs keys, using a local JSON-file store, stub scorer, and simulated voice agent. Real provider integrations activate only when required credentials/configuration are explicitly present.
- **Stack & Boundaries**: Preserve existing stack (React 18 + Vite, Node 20 + TypeScript, AWS SAM) and module boundaries. Keep modules small and strongly typed.
- **Schema Validation**: All AI outputs and API payloads must be schema-validated.
- **Verification Workflow**: After each task, run typecheck and tests, then report what works and what does not.
- **Autonomy Constraint**: Do not ask the user questions; state assumptions clearly in the final message. Do not add unrequested features.
