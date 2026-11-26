# PROOFFOLIO — JUDGES-READY VISUAL EXPRESSION & DESIGN POLISH PROMPT

Act as a principal product designer, Awwwards-caliber creative frontend engineer, accessibility specialist, and motion-design director.

Your task is to elevate the existing Prooffolio website into a visually unforgettable, polished, premium product experience for hackathon judges — WITHOUT breaking, deleting, replacing, renaming, or weakening any existing working components or functionality.

Repository: https://github.com/AnanthAkshay/Whackiest_2k26

## 0. NON-NEGOTIABLE: PRESERVE THE EXISTING PRODUCT

This is a visual refinement and careful composition task, not a rewrite.

Before editing:
1. Read `AGENTS.md`, the README, existing design notes, route definitions, all relevant page components, shared component exports, theme tokens, stylesheets, tests, and current screenshots.
2. Map the current component tree and identify which components are already integrated versus merely available.
3. Inspect existing dependencies and use what is already installed. Do not add a library just because it is fashionable.
4. Establish a baseline by running the available typecheck, tests, and build. Record failures that existed before your changes.
5. Make a short implementation plan based on the actual app, not assumptions.

Hard preservation rules:
- Do NOT delete or wholesale replace any existing component, page, route, hook, API integration, state model, domain rule, or user flow.
- Do NOT rename existing exports, props, route paths, CSS contracts, storage keys, or public interfaces merely to make styling easier.
- Do NOT replace functional components with decorative mockups.
- Do NOT remove working interactions, keyboard support, form validation, loading/error/empty states, or responsive behavior.
- Do NOT change product logic, assessment weights, ECVE scoring, passport cryptography, credential lifecycle, privacy rules, matching rules, offline behavior, voice flows, or API contracts.
- Do NOT introduce fake metrics, fake trust claims, fabricated candidate stories, fake employers, or misleading sample/live labels.
- Keep the existing English, Hindi, and Kannada experience intact. All new visible copy must use the existing i18n mechanism and be translatable.
- Preserve mobile-first behavior and the 360px viewport requirement.
- Keep reduced-motion support and accessible focus states.
- Reuse and compose existing components before creating new ones. New components are allowed only where a real reusable gap exists.
- Preserve the existing theme preference behavior and system preference fallback.
- If a component cannot safely support a visual treatment, leave its behavior and semantics unchanged rather than forcing the treatment.
- Do not perform a broad refactor.

## 1. DESIGN NORTH STAR — “PROOF, MADE BEAUTIFUL”

The experience should feel like a blend of:
- Apple's editorial restraint and precision.
- Linear's product clarity and information hierarchy.
- Stripe's trust-building data presentation.
- Awwwards-level art direction used selectively, never at the expense of usability.

The emotional response should be:
“ This feels like a serious, beautifully engineered platform that respects the people using it.”

Prooffolio is an evidence-first skill-to-employment platform. Visual design should communicate dignity, capability, trust, human agency and verifiable progress — not a generic AI dashboard or crypto product.

Avoid:
- Generic purple/blue AI gradients.
- Neon cyberpunk styling.
- Excessive glow, blur, glass panels or floating cards.
- Rainbow accents and too many competing colors.
- Huge rounded cards everywhere.
- Gratuitous 3D effects, looping animations or cursor gimmicks.
- Dense dashboard layouts that make candidates feel evaluated or intimidated.
- Decorative charts that imply unsupported precision.

## 2. SIGNATURE COLOR SYSTEM — “PORCELAIN + FOREST”

Retain semantic theme tokens and light/dark support. Refine the visual palette through the existing token system rather than scattering hard-coded colors across components.

### Light theme
- Porcelain canvas: `#F7F8F5`
- Elevated surface: `#FFFFFF`
- Soft sage section: `#EEF3EE`
- Primary ink: `#17221D`
- Secondary text: `#65736B`
- Hairline border: `#E1E8E1`
- Primary forest: `#087F5B`
- Deep forest hover: `#066647`
- Mint tint: `#DDF4E9`
- Warm highlight / human touch: `#D9A86C` (rarely, as a micro-accent only)

### Dark theme
- Deep evergreen canvas: `#0C1411`
- Elevated surface: `#121E18`
- Secondary surface: `#192820`
- Primary text: `#F1F6F2`
- Secondary text: `#A4B5AA`
- Hairline border: `#2A3A31`
- Primary mint/forest accent: `#43C995`
- Deep hover: `#65D9AA`
- Warm highlight: `#D9A86C` (rare micro-accent)

### Semantic status colors
Use accessible, distinguishable status colors and never rely on color alone:
- Success / demonstrated: forest green.
- In progress / partially demonstrated: warm amber.
- Pending human review: muted slate.
- Error / failed: accessible muted red.
- Informational / offline: calm blue-gray.

Rules:
- Check WCAG contrast for text, controls, badges, focus rings and chart labels in both themes.
- Preserve semantic meaning of status tokens.
- Define/adjust tokens centrally in the existing token stylesheet.
- Avoid hard-coded new palette values in individual page styles unless they are decorative art-direction details.
- Use gradients sparingly: subtle forest-to-mint tonal transitions, radial light, or a soft aurora behind a focal element.
- Never let an accent color reduce the legibility of scores, form controls, or evidence.

## 3. TYPOGRAPHY & LAYOUT

Aim for crisp editorial hierarchy:
- Use the current installed/system font stack unless there is already a suitable bundled font.
- Large headings: confident, compact, carefully line-broken.
- Body copy: calm, readable, generous line-height.
- Eyebrows and metadata: small, uppercase only when useful, with restrained tracking.
- Scores and technical values: tabular numerals and consistent alignment.
- Avoid overly thin typography and excessive all-caps.

Layout:
- Use a clear maximum content width and consistent gutters.
- Establish a deliberate 8px spacing rhythm using existing spacing tokens.
- Alternate spacious editorial sections with compact, information-rich sections.
- Use asymmetry and bento compositions only where they improve hierarchy.
- Keep content readable at 360px; no horizontal overflow.
- Use whitespace as a design element.
- Prefer fine dividers and subtle surface shifts over boxing every item.

## 4. SIGNATURE HERO — MAKE THE FIRST 5 SECONDS COUNT

Refine the existing landing hero; do not replace its content or CTA behavior.

Desired expression:
- Beautiful typography with an intentional line break and a strong editorial headline.
- A short supporting statement that makes the product's value immediately understandable to a candidate and judge.
- Primary CTA visually dominant; secondary CTA clearly secondary.
- A composed proof/skill-passport visual that demonstrates what the product actually does.
- Gentle ambient background treatment: subtle shader/aurora or radial illumination, low contrast and low GPU cost.
- Small evidence/status details that are grounded in existing demo data.
- A restrained floating verification motif, not an entire screen of glass cards.

The hero must explain the core difference:
Candidates demonstrate real work, explain their decisions, and receive evidence-backed verification — not merely a quiz score or a self-reported certificate.

If a demo preview exists, keep it data-driven and clearly labelled as a sample/demo.

## 5. COMPONENT COMPOSITION — USE WHAT IS ALREADY IN THE REPOSITORY

Inspect the actual exports and implementation details before integrating any component. The following are candidates, not mandatory placements. Use only where they create a meaningful improvement.

### Aceternity UI
- Spotlight: subtle hero focal light, only if it does not obscure text.
- AuroraBackground / BackgroundBeams: hero or one section transition, low intensity.
- TextGenerateEffect / TypewriterEffect: one intentional headline accent at most; keep static accessible text available.
- Card3D: one showcase/passport interaction, only if touch-safe and not disorienting.
- GlareCard / MovingBorder / GlowingEffect: use sparingly for the featured proof/passport or primary interactive demo.
- TracingBeam: candidate journey / process narrative, if it improves wayfinding.
- BentoGrid: selected feature overview, not every section.
- AnimatedTabs: existing tab content where it adds clarity.
- MultiStepLoader: meaningful async processing states only.
- FocusCards / CardStack: optional progressive feature or story reveal only if content warrants it.
- MacbookScroll: only if an existing desktop product preview benefits; do not introduce a fake product screenshot.
- EvervaultCard: avoid unless its interaction has a clear product purpose.
- PinBadge: small verification or contextual annotations, not decoration overload.

### Animmaster
- ShaderHeroCanvas: premium hero background, only if performance, accessibility and fallback are handled.
- Magnetic: subtle pointer attraction for desktop CTAs only; no effect on mobile/touch.
- ScrollParallax: small depth movement for selected editorial visuals, not content users must read.
- VerificationSealSvg: use around an actual passport/verification moment, not as an unsupported trust claim.

### Skiper UI
- DynamicIsland: compact global progress/connection/session status if it can reflect real app state.
- MinimalCardExpand: progressive disclosure for an existing card/list.
- ScrollImagesReveal: use only where real product imagery or existing screenshots are available.
- SvgFollowScroll: process/learning journey only if it remains readable and keyboard accessible.
- VercelTooltip: only for real contextual explanations.
- AiInput: only for an existing AI input or viva interaction; do not fake an assistant capability.

### Shared UI
Prioritize the existing Glass, Card, GlassCard, GlassPanel, GlassHeader, GlassNavigation, GlassModal, GlassSheet, Badge/Chip, Button, ProgressRing, Stepper, Tabs, Toast, Skeleton, StatusMark, Accordion, Input, Modal and related primitives.

Composition rules:
- Reuse existing component APIs and styles.
- Keep state and business logic in their existing owners.
- Do not wrap every component in glass.
- Keep interactive hit areas large and clear.
- Make hover enhancements optional; keyboard and touch must work equally well.
- Preserve semantic HTML and accessible names.
- Add no component merely to display an animation.

## 6. PAGE-BY-PAGE ART DIRECTION

Adapt these recommendations to the actual pages and routes found in the repository. Do not invent new flows.

### Landing
- Signature editorial hero.
- Elegant proof preview.
- Concise trust strip using only verified product capabilities.
- Seven-stage journey presented as a clear narrative.
- ECVE pillars shown with visual hierarchy, while preserving exact existing weights and explanation.
- Passport showcase as the visual centerpiece.
- Opportunity matching preview that explains matched skills and skill gaps.
- Strong, calm final CTA.

### Candidate onboarding / profile / role
- Friendly, low-friction, dignified.
- Clear one-action-at-a-time hierarchy.
- Progress indication that does not feel punitive.
- Excellent language selector presentation for English, Hindi and Kannada.

### Learn / Practise
- Clear learning cards and progress states.
- Editorial lesson typography.
- Calm completion and practice feedback.
- Keep offline states visible and honest.

### Demonstrate / challenge / upload
- Make the task and expected artifact obvious.
- A premium upload zone with clear file constraints and reassuring privacy language that already exists in product copy.
- Clear file selected, validating, success and failure states.
- Do not make drag-and-drop the only interaction.

### AI Viva / explain
- Human, focused interview room.
- One primary question at a time.
- Clear mic/listening/speaking states and text fallback.
- Subtle waveform or activity visualization only when tied to real audio state.
- Never animate as though the AI is listening when it is not.
- Keep candidate control and privacy visible.

### Cross-verify / results
- Present P, U and C with exact existing definitions and weights.
- Make evidence and outcome rationale understandable.
- Demonstrate what passed, what needs improvement and why.
- Avoid judgmental red-heavy design.
- Pending Human Review must be visually distinct from failure.
- Do not overstate what automated assessment proves.

### Skill Passport
- Make this the signature “wow” moment.
- Premium document/card treatment with a restrained verification seal.
- Clear outcome, skill, challenge, issue/validity details and verification action using actual data.
- QR or share affordances only where already supported.
- Strong visual distinction between public/consented information and private evidence.

### Connect / opportunities
- Strong role cards, clear match percentage presentation, matched skills and gaps.
- Distinguish sample from live opportunities accurately.
- Keep user agency explicit; never imply automatic application or rejection.
- Provide clear filter and empty states.

### Health / integrations
- Technical but calm.
- Real status indicators, timestamps and clear provider/configuration states.
- No decorative fake metrics or fake live animations.

## 7. MOTION SYSTEM — RESTRAINED, PURPOSEFUL, POLISHED

Use motion to guide attention and communicate state:
- Page entrance: short opacity + 8–14px translate, stagger only for small groups.
- Section reveal: subtle and one-time; content must remain visible without JS.
- Hover: 150–220ms, 1–2px lift at most, border and shadow refinement.
- CTA: gentle highlight/press feedback.
- Progress: smooth transition only when actual values change.
- Passport seal: one subtle reveal on entry, no continuous spinning.
- Background shader: low-amplitude, slow, non-distracting.
- Use CSS transforms and opacity where possible.
- Avoid scroll hijacking, long delays, parallax on essential text, autoplay sound, and motion that blocks interaction.
- Respect `prefers-reduced-motion` globally and per component.
- Disable expensive effects on coarse pointers, small screens, low-power contexts and reduced-motion preference.
- Ensure no animation causes layout shifts or content to become inaccessible.

## 8. GLASSMORPHISM — SELECTIVE, NOT UNIVERSAL

Use glass only for layers that should feel elevated or transient:
- Floating navigation or compact status surfaces.
- Hero proof preview.
- A featured passport overlay.
- Select modals/sheets/popovers.
- Small contextual floating badges.

Glass recipe:
- Translucent surface with sufficient opacity.
- Fine 1px border.
- Restrained backdrop blur.
- Soft shadow and a faint top highlight.
- A solid/fallback background for browsers without backdrop-filter.

Do not use glass on every section, every card, or long-form text. Maintain contrast in both themes.

## 9. PERFORMANCE, ACCESSIBILITY & RESPONSIVENESS

- Preserve the existing React/Vite architecture and dependency footprint.
- Lazy-load non-critical heavy visual components where appropriate.
- Avoid large canvas work on low-end devices; provide a static gradient fallback.
- Avoid layout shift; reserve image/canvas dimensions.
- Keep bundle growth intentional and report any large additions.
- Test 360px, 390px, 768px, 1024px and 1440px widths.
- Keyboard-test navigation, dialogs, tabs, tooltips and all newly enhanced interactions.
- Add accessible labels and descriptions for decorative/interactive visuals.
- Maintain visible focus states.
- Check contrast in both themes.
- Respect reduced motion.
- Keep touch targets comfortably usable.
- Preserve offline mode and service-worker behavior.

## 10. QUALITY GATES — DO NOT CALL IT DONE WITHOUT THESE

After each coherent page group:
1. Run typecheck.
2. Run relevant tests.
3. Run the production build.
4. Fix regressions introduced by your changes.
5. Inspect screenshots at desktop and mobile sizes.
6. Check both light and dark themes.
7. Verify all relevant links, forms, CTAs, tabs, modals, upload flow and navigation still work.
8. Check console errors and horizontal overflow.
9. Confirm no unsupported claims or fabricated content were introduced.

Create before/after screenshots for the landing page and the most visually important user journey screens if the available tooling supports it.

## 11. EXECUTION ORDER

Work in this order; do not try to animate the entire app at once:
1. Audit the live codebase and map existing components, styles and routes.
2. Establish baseline test/build status.
3. Refine central theme tokens and typography.
4. Elevate the landing hero and first viewport.
5. Compose the seven-stage journey and passport showcase.
6. Polish the candidate journey screens while preserving their behavior.
7. Refine AI Viva and results visual states.
8. Polish opportunities, health and integrations.
9. Add only the best-performing motion and visual effects.
10. Run regression checks and inspect responsive screenshots.
11. Summarize files changed, components reused, new components created (if any), tests run, and any unresolved issues.

## 12. FINAL DESIGN REVIEW — JUDGE'S FIRST IMPRESSION TEST

Before finishing, review the site as a skeptical hackathon judge:
- In five seconds, can I understand what Prooffolio does?
- Does the first screen feel distinctive and professionally art-directed?
- Is the difference between self-reported skills and demonstrated evidence obvious?
- Does the Skill Passport feel credible and desirable?
- Is the candidate treated with dignity?
- Can I navigate the experience without explanation?
- Does the UI look cohesive across every route?
- Does it work beautifully on a phone?
- Are visual effects enhancing the product rather than competing with it?
- Are all claims and states honest?

The final result should feel premium, calm, technically credible and memorable. Aim for a few exceptional visual moments supported by excellent product design — not a pile of effects.

**Most important instruction: preserve the working Prooffolio system and its components. Improve its expression, not its identity or functionality.**
