---
name: Prooffolio
description: Work. Explain. Verify. Learn. Connect.
colors:
  review-lavender: "#B9A9D4"
  washi-cream: "#F4F0E4"
  paper-surface: "#FCFAF3"
  parchment-tint: "#EDE9DC"
  kohaku-ink: "#0B0B0B"
  muted-stone: "#5B574E"
  focus-navy: "#1B1B4B"
  dark-surface: "#1B1A15"
  dark-bg: "#14130F"
  dark-muted: "#B8B3A6"
  status-ok: "#1F5B3F"
  status-warn: "#7A520B"
  status-bad: "#932D22"
typography:
  display:
    fontFamily: "Manrope, Noto Sans Devanagari, Noto Sans Kannada, sans-serif"
    fontSize: "clamp(3rem, 9vw, 7rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Manrope, Noto Sans Devanagari, Noto Sans Kannada, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, Noto Sans Devanagari, Noto Sans Kannada, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  label:
    fontFamily: "Manrope, Noto Sans Devanagari, Noto Sans Kannada, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
  "4xl": "96px"
components:
  button-primary:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.kohaku-ink}"
    rounded: "{rounded.none}"
    padding: "12px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.kohaku-ink}"
    textColor: "{colors.washi-cream}"
  button-dark:
    backgroundColor: "{colors.kohaku-ink}"
    textColor: "{colors.washi-cream}"
    rounded: "{rounded.none}"
    padding: "12px 20px"
    height: "48px"
  input-field:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.kohaku-ink}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
    height: "56px"
  card-surface:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.kohaku-ink}"
    rounded: "{rounded.none}"
    padding: "24px"
  chip-tag:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.kohaku-ink}"
    rounded: "{rounded.none}"
    padding: "8px 14px"
---

# Design System: Prooffolio

## Overview

**Creative North Star: "The Printed Folio"**

Prooffolio's visual system ("Kōhaku") is built from warm washi-cream paper, sharp black ink, and structural 2px rules. Every screen reads like a calm, printed dossier: zero rounded corners, zero drop shadows, and zero decorative blur. Hierarchy comes from bold, tightly tracked Manrope headlines paired with ruled label-and-value rows and tabular numerals.

Dark `#0B0B0B` surfaces are reserved exclusively for high-focus moments—the landing hero, the live AI Viva voice stage, and the verifiable Skill Passport credential—where cream ink and a single Review Lavender accent establish institutional gravity. Across English, Hindi, and Kannada, the system preserves generous line height and 48px touch targets so first-time mobile users can navigate with clarity and dignity.

**Key Characteristics:**
- Warm paper ground (`washi-cream`) paired with crisp `kohaku-ink` outlines and zero corner radius.
- Single lavender accent (`review-lavender`) reserved for system announcements, active/deciding rows, and Pending Human Review states.
- Tabular Manrope numerals (`tabular-nums`) for scores, percentages, and step indices; JetBrains Mono for SHA-256 hashes, cell references, and Key IDs.
- Multilingual parity across Latin, Devanagari (`hi`), and Kannada (`kn`) with `line-height: 1.7` and disabled uppercase transforms for Indic scripts.

## Colors

The palette pairs warm paper neutrals with sharp ink contrast, reserving a single lavender accent for state emphasis and desaturated semantic tones for status text.

### Primary
- **Review Lavender** (`review-lavender`): Used solely for the dismissible system announcement bar, the active/deciding row highlight (`CurrentRow`), the Skill Passport top rule, and Pending Human Review / Mock Mode markers.

### Neutral
- **Washi Cream** (`washi-cream`): Default page canvas background in light mode (`#F4F0E4`).
- **Paper Surface** (`paper-surface`): Elevated surface fill for headers, cards, inputs, and default buttons (`#FCFAF3`).
- **Parchment Tint** (`parchment-tint`): Disabled control fill, unavailable option fill, and skeleton pulse base (`#EDE9DC`).
- **Kōhaku Ink** (`kohaku-ink`): Primary text, 2px structural borders, solid StatusMark squares, and dark-section backgrounds (`#0B0B0B`).
- **Muted Stone** (`muted-stone`): Secondary text, uppercase field labels, and ruled-row keys; passes WCAG AA on Washi Cream (`#5B574E`).
- **Focus Navy** (`focus-navy`): High-contrast 3px keyboard focus outline (`#1B1B4B`, shifting to Review Lavender on dark mode).
- **Dark Ground / Surface** (`dark-bg`, `dark-surface`, `dark-muted`): User-selectable dark theme mirroring the same structural contrast (`#14130F`, `#1B1A15`, `#B8B3A6`).

### Named Rules
**The Single-Accent Rule.** Review Lavender is the only chromatic accent in the system; never introduce secondary brand gradients, neon highlights, or multi-hue badges.
**The Honest Status Rule.** Semantic tones (`status-ok`, `status-warn`, `status-bad`) appear only as text color, 4px left rules, or square `StatusMark` geometry—never as bright filled pills.

## Typography

**Display & Body Font:** Manrope (with `Noto Sans Devanagari`, `Noto Sans Kannada`, and metric-adjusted `Manrope Fallback`)
**Mono Font:** JetBrains Mono (for SHA-256 fingerprints, JWS Key IDs, and spreadsheet cell references)

**Character:** Geometric clarity with tight display tracking and open body rhythm, engineered for effortless scanning on 360px viewports and crisp rendering across Devanagari and Kannada glyphs.

### Hierarchy
- **Display** (800, `clamp(3rem, 9vw, 7rem)`, `line-height: 1`, `letter-spacing: -0.03em`): Page titles and primary outcome headlines.
- **Headline** (700, `clamp(1.75rem, 4vw, 2.75rem)`, `line-height: 1.1`, `letter-spacing: -0.02em`): Major section headings.
- **Body** (400, `20px` desktop / `18px` mobile, `line-height: 1.6`, max `62ch` for leads): Primary reading copy and explanations.
- **Label** (700, `13px`, uppercase, `letter-spacing: 0.06em`): Form labels, eyebrows, and table keys. Automatically switches to `text-transform: none; letter-spacing: 0; line-height: 1.7` for `:lang(hi)` and `:lang(kn)`.
- **Mono** (400–600, `13px–15px`): Cryptographic hashes, cell references, and validator status codes.

### Named Rules
**The Indic Breathing Room Rule.** Whenever `:lang(hi)` or `:lang(kn)` is active, disable uppercase and positive letter-spacing on labels and raise line-height to `1.7` (`1.25` on display headings) so matras and conjuncts never clip.

## Layout

Content sits inside a centered `1200px` max-width container (`48px` horizontal padding on desktop, `20px` on mobile) built on a `4px`/`8px` spacing scale (`4, 8, 12, 16, 24, 32, 48, 64, 96`). Multi-step forms (Demonstrate, Validation, AI Viva Setup) pair a left primary form column with a sticky `SUMMARY` panel on desktop (`>= 900px`) that collapses into a native `<details>` Accordion above the sticky action bar on mobile.

## Elevation & Depth

This system uses **zero drop shadows** and **zero backdrop blur**. Depth and containment are communicated strictly through 2px solid `kohaku-ink` outlines, 1px soft horizontal rules (`rgba(11, 11, 11, 0.25)`), and tonal contrast between `washi-cream` and `paper-surface` (or `#0B0B0B` on dark stages).

### Named Rules
**The Flat-Paper Rule.** Never add `box-shadow`, `backdrop-filter`, or hover scale transforms to cards, buttons, or modals.

## Shapes

Every element—buttons, inputs, cards, chips, modals, drawers, QR tiles, and images—uses **0px border-radius** (`rounded.none`). Square 14px `StatusMark` glyphs encode state by fill geometry rather than rounded pills: solid ink square (done / live), half-filled square (partial), outlined square (not yet / not configured), and lavender square (needs review / mock).

## Components

Controls are tactile, rectangular, and ink-bordered, inverting background and ink on hover with zero spatial movement.

### Buttons
- **Shape:** Sharp rectangular corners (`0px` radius), `2px` solid ink border, minimum `48px` height (`12px 20px` padding).
- **Primary / Secondary:** `paper-surface` fill with `kohaku-ink` text; inverts to `kohaku-ink` fill with `washi-cream` text on hover, and shows a `2px` inner inset frame on active press.
- **Dark / Selected:** Solid `kohaku-ink` fill with `washi-cream` text.
- **Disabled / Unavailable Option:** `parchment-tint` fill, soft border, muted text, with `line-through` reserved for unavailable `OptionButton` choices.

### Chips
- **Style:** `0px` radius, `2px` solid ink border, `paper-surface` fill, `15px` bold (`8px 14px` padding).
- **State:** Optional `4px` left semantic rule (`status-ok`, `status-warn`, `status-bad`) or `review-lavender` fill for review/demo tags.

### Cards / Containers
- **Corner Style:** `0px` radius.
- **Background:** `paper-surface` (or `#0B0B0B` for dark hero, Voice Viva, and Skill Passport panels).
- **Shadow Strategy:** None; `2px` solid ink border.
- **Internal Padding:** `24px` default (`16px` compact, `32px` spacious).

### Inputs / Fields
- **Style:** `2px` solid ink border, `paper-surface` fill, `56px` height, `12px 16px` padding, uppercase label above.
- **Focus:** `3px` solid `focus-navy` outline with `3px` offset.
- **Error:** `4px` solid ink left border paired with an inline `.pf-field-error` message linked via `aria-describedby`.

### Navigation
- **Style:** Sticky top header on `paper-surface` with `1px` bottom rule and a `2px` ink `scaleX` scroll-progress indicator; `TextLink` items (`1px` underline, `3px` offset, bold when current); square `EN | हिं | ಕನ್ನಡ` segmented control; full-height mobile drawer + flush 5-cell square mobile dock below `768px`.

### RuledRow & CurrentRow (Signature Component)
Two-column key/value rows separated by `1px` soft horizontal rules (`RuledRow`) for pipelines, summaries, ECVE pillars, and passport facts. The active stage or deciding pillar uses `CurrentRow`: `review-lavender` fill bounded by `2px` solid ink top and bottom rules.

### OptionButton (Selectable Grid Cell)
- **Style:** `0px` radius, `2px` solid ink border, `paper-surface` fill, `48px` minimum height, `12px 16px` padding.
- **Selected:** Solid `kohaku-ink` fill with `washi-cream` text (`aria-pressed="true"`).
- **Unavailable:** `parchment-tint` fill, soft border, `muted-stone` struck-through text (`line-through`), `aria-disabled="true"`, paired with an `InfoNote` explaining the reason and fallback.

### Tabs & Accordions
- **Tabs:** Text-only horizontal tabs sitting on a `2px` solid ink base rule; the active tab uses `700` ink text and a `4px` solid ink bottom underline.
- **Accordions (`details`/`summary`):** `2px` solid ink top rule, `1px` soft bottom rule, bold summary row (`48px` minimum height) with right-aligned Phosphor caret, and ruled content rows inside.

### StatusMark
- **Geometry:** `14px × 14px` square with `2px` solid border paired with `15px` bold label text.
- **Variants:** Solid ink square (`ok` / `live` / `done`), half-filled split square (`warn` / `partial`), outlined square (`neutral` / `not configured`), `review-lavender` square (`review` / `mock`), and double-inset bad square (`bad` / `issue`).

### Confirmation Modals & Sheets
- **Style:** `0px` radius, `2px` solid ink border on `paper-surface` over a `rgba(11, 11, 11, 0.65)` backdrop (`480px` max-width for modals, `540px` desktop / bottom sheet on mobile).
- **Behavior:** Focus-trapped, `Esc` closes, initial focus placed on `Cancel`, and destructive actions use explicit labels (e.g. `WITHDRAW PASSPORT`, `END SESSION`).

## Do's and Don'ts

### Do:
- **Do** enforce `0px` border-radius on every interactive and container element.
- **Do** use `RuledRow`, `CurrentRow`, and `StatusMark` squares for structured data, stages, and verification states.
- **Do** preserve `48px` minimum control height (`44px` minimum touch target) across 360px mobile viewports.

### Don't:
- **Don't** add drop shadows, glassmorphism (`backdrop-filter`), pill borders (`9999px`), or hover scale animations.
- **Don't** use emojis, Lucide icons, or multi-color gradients (the single frosted `"PROOFFOLIO"` hero wordmark is the sole `background-clip: text` exception).
- **Don't** apply `text-transform: uppercase` or positive letter-spacing to Hindi (`hi`) or Kannada (`kn`) text.
