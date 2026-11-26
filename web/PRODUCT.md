# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary users**: Informal learners and vocational graduates (including first-time smartphone users) seeking entry-level digital roles, starting with **Entry-Level Data Entry Operator**.
- **Secondary users**: Local entry-level employers verifying Skill Passports and reviewing transparent skill matches without automated hiring or rejection.

## Product Purpose

Prooffolio (*"Work. Explain. Verify. Learn. Connect."*) is an evidence-first, multilingual skill-to-employment platform. It helps candidates learn practical spreadsheet skills, clean a realistic `.xlsx` workplace workbook, explain their reasoning to an artifact-aware **AI Examiner** in the **AI Viva**, cross-verify spoken claims against deterministic file facts, earn a cryptographically signed **Skill Passport**, and discover local opportunities with transparent skill gaps.

Success means a candidate can complete the 7-stage journey with zero login friction, understand why they received their ECVE outcome, carry a verifiable Skill Passport (or receive fair Pending Human Review when evidence mismatches occur), and decide for themselves which opportunities to pursue.

## Positioning

Unlike resume-only job boards or unverified self-assessments, Prooffolio combines deterministic code-based `.xlsx` validation (`60%` Practical Execution) with an artifact-aware multilingual voice/text AI Viva (`25%` Conceptual Understanding) and automated explanation-to-artifact cross-verification (`15%` Evidence Consistency), binding authoritative *Demonstrated* outcomes to an Ed25519-signed JWS Skill Passport anchored to the submitted file's SHA-256 hash.

## Operating Context

- **7-stage candidate journey**: Learn -> Practise -> Demonstrate -> Explain (AI Viva) -> Cross-Verify -> Verify (Skill Passport) -> Connect.
- **MVP Challenge**: *Retail Sales Cleanup & Reporting* (`.xlsx` primary accepted format, max 10 MB).
- **Assessment outcomes**: *Not yet demonstrated* (`< 40`), *Partially demonstrated* (`40–74.99` or critical criterion failed), *Demonstrated* (`>= 75`, critical gates passed, no unresolved high-risk conflict — the only outcome eligible for Skill Passport issuance), and *Pending Human Review* (non-accusatory audit signal for unresolved mismatches, low transcript confidence, or disputes).
- **Connectivity boundaries**: Cached app shell, micro-lessons, practice drills, and queued eligible offline actions work offline; live AI Viva audio streaming, cloud `.xlsx` validation, Ed25519 signing, and public passport verification require active connectivity.
- **Local `MOCK_MODE=1` & `?demo=1`**: Full local workflow runs without AWS or ElevenLabs keys using local JSON storage, stub scorer, and simulated voice/text replay.

## Capabilities and Constraints

- **Zero login friction**: No account creation or passwords in the main candidate flow; quick-start via display handle or Demo Learner profile.
- **Voice + Text parity**: Live voice streaming (ElevenLabs STT/TTS) with automatic or manual **Text mode** fallback on every Viva screen.
- **Honesty & disclosure**: Rubric built from public sources (Microsoft MO-200 skills outline and Microsoft Support help pages); **not** trainer-verified and **not** an official Microsoft certification. Prohibited claims include `"trainer-verified"`, `"validated"`, `"certified"`, `"100% accurate"`, `"cheat-proof"`, `"guaranteed job"`, and uncalibrated agreement percentages.
- **Mandatory strings**:
  - `rubricBasis`: *"Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."* (must exist in `en`, `hi`, `kn`).
  - Database match badge: *"Record matches our database"*.
- **Integrity & privacy by default**: Mismatches are review signals, never accusations of cheating. Submitted `.xlsx` files, raw voice audio, and full transcripts remain private by default; public Skill Passports expose only consented summary fields.
- **Human agency**: Opportunity matching evaluates only active *Demonstrated* skills and never auto-applies or auto-rejects candidates.

## Brand Commitments

- **Product name**: Strictly **Prooffolio** (never "Prooffolio 2.0" or "Viva Teach-Back" in user-facing copy).
- **Tagline**: *"Work. Explain. Verify. Learn. Connect."*
- **AI Viva terminology**: Conducted by the **AI Examiner** as an integrated capability within Prooffolio.
- **Team / Event**: Team The North Remembers (MSRIT), wHACKiest 2026, Track 04 UnlockED.

## Evidence on Hand

- Seeded challenge workbook & deterministic Python/TypeScript `.xlsx` validator (`api/src/validator/`).
- Curated offline-capable micro-lessons and formative drills (`web/public/content/lessons.json`).
- Replayable `?demo=1` vertical slice and `tests/bluff/` separability harness.
- Sample local opportunities (`SAMPLE_OPPORTUNITIES` in `web/src/mock/demoData.ts`) clearly labeled as sample listings.
- External link-outs (`tryb`, `Devnovate`) and `.xyz` public domain are optional/unconfigured unless explicitly set via environment variables.

## Product Principles

1. **Evidence before claims**: Objective workbook checks and artifact-grounded explanations outweigh self-reported resumes.
2. **Fairness over false certainty**: Explanation-file mismatches trigger calm human review, never automated cheating accusations.
3. **Zero-friction multilingual access**: Every stage works on 360px mobile screens in English, Hindi, and Kannada, with Text mode always available alongside voice.
4. **Radical honesty**: Disclose public rubric sources, mock/simulated states, and sample vs. live listings clearly.
5. **Privacy and human agency by default**: Keep raw artifacts private and leave every application decision with the candidate.

## Accessibility & Inclusion

- **Mobile-first**: Primary target viewport is `360px` width, with `44px`+ touch targets.
- **Multilingual**: Full UI and AI Viva support in English (`en`), Hindi (`hi`), and Kannada (`kn`), including proper line-height and non-clipped glyphs for Devanagari and Kannada scripts.
- **Keyboard & assistive support**: Full keyboard navigation, visible focus rings, `aria-live` status announcements, and `prefers-reduced-motion` support.
