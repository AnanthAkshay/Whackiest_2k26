# Prooffolio UI Inventory

Generated: 2026-11-26T14:48:35.977Z
Base URL: http://localhost:5174
Static interactive elements scanned in `web/src`: 147

## Required Non-Button Features

- [x] **Language switcher (en/hi/kn)** (`language_switcher`)
- [x] **Offline cache indicator** (`offline_cache_indicator`)
- [x] **Text-mode fallback** (`text_mode_fallback`)
- [x] **?demo=1 replay** (`demo_replay`)
- [x] **Download starter workbook** (`download_starter_workbook`)
- [x] **XLSX upload and validation** (`xlsx_upload_validation`)
- [x] **Copy buttons** (`copy_buttons`)
- [x] **Share toggle** (`share_toggle`)
- [x] **Withdraw passport** (`withdraw`)
- [x] **tryb and Devnovate link-outs** (`tryb_devnovate_links`)
- [x] **Health and integrations page** (`health_integrations`)

## Route Summary

| Route | Demo 1280 | Demo 360 | Normal 1280 | HI | KN |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 43 | 43 | 42 | 43 | 43 |
| `/profile` | 45 | 45 | 45 | 45 | 45 |
| `/role` | 36 | 36 | 36 | 36 | 36 |
| `/learn` | 67 | 67 | 67 | 67 | 67 |
| `/challenge` | 40 | 40 | 40 | 40 | 40 |
| `/validation` | 36 | 36 | 36 | 36 | 36 |
| `/setup-viva` | 47 | 47 | 46 | 47 | 47 |
| `/session` | 27 | 27 | 27 | 27 | 27 |
| `/results/att_demo_retail_01` | 37 | 37 | 27 | 37 | 37 |
| `/passport/att_demo_retail_01` | 36 | 36 | 28 | 36 | 36 |
| `/opportunities` | 55 | 55 | 55 | 55 | 55 |
| `/integrations` | 36 | 36 | 36 | 36 | 36 |
| `/health` | 30 | 30 | 30 | 30 | 30 |
| `/nonexistent-404` | 29 | 29 | 29 | 29 | 29 |

### `/`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `button` | `button` | Start demo replay | - | - | - | false | true |
| 16 | `button` | `button` | START THE CHALLENGE | - | - | - | false | true |
| 17 | `button` | `button` | See a sample passport | - | - | - | false | true |
| 18 | `button` | `button` | Text mode (typing only) | - | - | - | false | true |
| 19 | `button` | `button` | Explore sample opportunities | - | - | - | false | true |
| 20 | `a` | `a` | Open → | - | - | - | false | true |
| 21 | `a` | `a` | Open → | - | - | - | false | true |
| 22 | `a` | `a` | Open → | - | - | - | false | true |
| 23 | `a` | `a` | Open → | - | - | - | false | true |
| 24 | `a` | `a` | Open → | - | - | - | false | true |
| 25 | `a` | `a` | Open → | - | - | - | false | true |
| 26 | `a` | `a` | Open → | - | - | - | false | true |
| 27 | `summary` | `summary` | Do I need an account or password? | - | - | - | false | true |
| 28 | `summary` | `summary` | What if I do not have a microphone or quiet room? | - | - | - | false | true |
| 29 | `summary` | `summary` | What happens when the AI flags a mismatch? | - | - | - | false | true |
| 30 | `summary` | `summary` | Are my uploaded spreadsheets public? | - | - | - | false | true |
| 31 | `a` | `a` | How it works | - | - | - | false | true |
| 32 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 33 | `a` | `a` | For employers | - | - | - | false | true |
| 34 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 35 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 36 | `a` | `a` | System health | - | - | - | false | true |
| 37 | `a` | `a` | Integrations | - | - | - | false | true |
| 38 | `a` | `a` | Learn | - | - | - | false | true |
| 39 | `a` | `a` | Challenge | - | - | - | false | true |
| 40 | `a` | `a` | Explain | - | - | - | false | true |
| 41 | `a` | `a` | Passport | - | - | - | false | true |
| 42 | `a` | `a` | Connect | - | - | - | false | true |
| 43 | `button` | `button` | HELP | Help | - | - | false | true |

### `/profile`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `button` | `button` | Use Demo Learner (Demo Data) | - | - | - | false | true |
| 23 | `input` | `input` | e.g. Ananya | - | - | profile-name | false | true |
| 24 | `input` | `input` | Entry-Level Data Entry Operator | - | - | profile-goal | false | true |
| 25 | `button` | `button` | English | - | - | - | false | true |
| 26 | `button` | `button` | हिन्दी | - | - | - | false | true |
| 27 | `button` | `button` | ಕನ್ನಡ | - | - | - | false | true |
| 28 | `input` | `input` | e.g. Hubballi, Dharwad | - | - | profile-location | false | true |
| 29 | `input` | `input` | on | - | - | - | false | true |
| 30 | `input` | `input` | on | - | - | - | false | true |
| 31 | `input` | `input` | on | - | - | - | false | true |
| 32 | `button` | `button` | Continue to role selection | - | - | - | false | true |
| 33 | `a` | `a` | How it works | - | - | - | false | true |
| 34 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 35 | `a` | `a` | For employers | - | - | - | false | true |
| 36 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 37 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 38 | `a` | `a` | System health | - | - | - | false | true |
| 39 | `a` | `a` | Integrations | - | - | - | false | true |
| 40 | `a` | `a` | Learn | - | - | - | false | true |
| 41 | `a` | `a` | Challenge | - | - | - | false | true |
| 42 | `a` | `a` | Explain | - | - | - | false | true |
| 43 | `a` | `a` | Passport | - | - | - | false | true |
| 44 | `a` | `a` | Connect | - | - | - | false | true |
| 45 | `button` | `button` | HELP | Help | - | - | false | true |

### `/role`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `button` | `button` | Retail & Supply Chain LogisticsEntry-Level Data Entry Operat | - | - | - | false | true |
| 23 | `button` | `button` | Back | - | - | - | false | true |
| 24 | `a` | `a` | How it works | - | - | - | false | true |
| 25 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 26 | `a` | `a` | For employers | - | - | - | false | true |
| 27 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 28 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 29 | `a` | `a` | System health | - | - | - | false | true |
| 30 | `a` | `a` | Integrations | - | - | - | false | true |
| 31 | `a` | `a` | Learn | - | - | - | false | true |
| 32 | `a` | `a` | Challenge | - | - | - | false | true |
| 33 | `a` | `a` | Explain | - | - | - | false | true |
| 34 | `a` | `a` | Passport | - | - | - | false | true |
| 35 | `a` | `a` | Connect | - | - | - | false | true |
| 36 | `button` | `button` | HELP | Help | - | - | false | true |

### `/learn`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `button` | `button` | All | - | - | - | false | true |
| 23 | `button` | `button` | Completed | - | - | - | false | true |
| 24 | `button` | `button` | Remaining | - | - | - | false | true |
| 25 | `button` | `tab` | All | - | - | - | false | true |
| 26 | `button` | `tab` | Basics | - | - | - | false | true |
| 27 | `button` | `tab` | Cleanup | - | - | - | false | true |
| 28 | `button` | `tab` | Formulas | - | - | - | false | true |
| 29 | `button` | `tab` | Reporting | - | - | - | false | true |
| 30 | `summary` | `summary` | Rubric links and notes | - | - | - | false | true |
| 31 | `button` | `button` | Mark as read | - | - | - | false | true |
| 32 | `summary` | `summary` | Rubric links and notes | - | - | - | false | true |
| 33 | `button` | `button` | Mark as read | - | - | - | false | true |
| 34 | `summary` | `summary` | Rubric links and notes | - | - | - | false | true |
| 35 | `button` | `button` | Mark as read | - | - | - | false | true |
| 36 | `summary` | `summary` | Rubric links and notes | - | - | - | false | true |
| 37 | `button` | `button` | Mark as read | - | - | - | false | true |
| 38 | `summary` | `summary` | Rubric links and notes | - | - | - | false | true |
| 39 | `button` | `button` | Mark as read | - | - | - | false | true |
| 40 | `summary` | `summary` | Rubric links and notes | - | - | - | false | true |
| 41 | `button` | `button` | Mark as read | - | - | - | false | true |
| 42 | `summary` | `summary` | Rubric links and notes | - | - | - | false | true |
| 43 | `button` | `button` | Mark as read | - | - | - | false | true |
| 44 | `button` | `button` | Row 3 (ORD-105, Meena, 750) | - | - | - | false | true |
| 45 | `button` | `button` | Row 4 (ORD-104, Ravi, 500) | - | - | - | false | true |
| 46 | `button` | `button` | Remove all three rows | - | - | - | false | true |
| 47 | `button` | `button` | =SUM(D2:D101, "Electronics") | - | - | - | false | true |
| 48 | `button` | `button` | =COUNTIF(D2:D101, "Electronics") | - | - | - | false | true |
| 49 | `button` | `button` | =AVERAGE(D2:D101) | - | - | - | false | true |
| 50 | `button` | `button` | Text prefixes like 'Rs.' make Excel treat the cell as text i | - | - | - | false | true |
| 51 | `button` | `button` | SUM only works up to row 10 | - | - | - | false | true |
| 52 | `button` | `button` | Cell E15 needs bold formatting | - | - | - | false | true |
| 53 | `button` | `button` | Continue to Challenge | - | - | - | false | true |
| 54 | `button` | `button` | Back | - | - | - | false | true |
| 55 | `a` | `a` | How it works | - | - | - | false | true |
| 56 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 57 | `a` | `a` | For employers | - | - | - | false | true |
| 58 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 59 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 60 | `a` | `a` | System health | - | - | - | false | true |
| 61 | `a` | `a` | Integrations | - | - | - | false | true |
| 62 | `a` | `a` | Learn | - | - | - | false | true |
| 63 | `a` | `a` | Challenge | - | - | - | false | true |
| 64 | `a` | `a` | Explain | - | - | - | false | true |
| 65 | `a` | `a` | Passport | - | - | - | false | true |
| 66 | `a` | `a` | Connect | - | - | - | false | true |
| 67 | `button` | `button` | HELP | Help | - | - | false | true |

### `/challenge`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `a` | `a` | DOWNLOAD STARTER WORKBOOK | - | - | - | false | true |
| 23 | `input` | `input` | - | - | - | challenge-file-input | false | true |
| 24 | `label` | `button` | Choose .xlsx file | - | - | - | false | true |
| 25 | `button` | `button` | Load Demo Cleaned XLSX (Demo Data) | - | - | - | false | true |
| 26 | `summary` | `summary` | SUMMARY | - | - | - | false | true |
| 27 | `button` | `button` | Back | - | - | - | false | true |
| 28 | `a` | `a` | How it works | - | - | - | false | true |
| 29 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 30 | `a` | `a` | For employers | - | - | - | false | true |
| 31 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 32 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 33 | `a` | `a` | System health | - | - | - | false | true |
| 34 | `a` | `a` | Integrations | - | - | - | false | true |
| 35 | `a` | `a` | Learn | - | - | - | false | true |
| 36 | `a` | `a` | Challenge | - | - | - | false | true |
| 37 | `a` | `a` | Explain | - | - | - | false | true |
| 38 | `a` | `a` | Passport | - | - | - | false | true |
| 39 | `a` | `a` | Connect | - | - | - | false | true |
| 40 | `button` | `button` | HELP | Help | - | - | false | true |

### `/validation`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `button` | `button` | Go to Challenge | - | - | - | false | true |
| 23 | `button` | `button` | Load Demo Report | - | - | - | false | true |
| 24 | `a` | `a` | How it works | - | - | - | false | true |
| 25 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 26 | `a` | `a` | For employers | - | - | - | false | true |
| 27 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 28 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 29 | `a` | `a` | System health | - | - | - | false | true |
| 30 | `a` | `a` | Integrations | - | - | - | false | true |
| 31 | `a` | `a` | Learn | - | - | - | false | true |
| 32 | `a` | `a` | Challenge | - | - | - | false | true |
| 33 | `a` | `a` | Explain | - | - | - | false | true |
| 34 | `a` | `a` | Passport | - | - | - | false | true |
| 35 | `a` | `a` | Connect | - | - | - | false | true |
| 36 | `button` | `button` | HELP | Help | - | - | false | true |

### `/setup-viva`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `button` | `button` | Start demo replay | - | - | - | false | true |
| 23 | `button` | `radio` | EnglishWorkplace English | - | - | - | false | true |
| 24 | `button` | `radio` | हिन्दीसरल हिन्दी | - | - | - | false | true |
| 25 | `button` | `radio` | ಕನ್ನಡಸರಳ ಕನ್ನಡ | - | - | - | false | true |
| 26 | `button` | `button` | Voice | - | - | - | false | true |
| 27 | `button` | `button` | Text | - | - | - | false | true |
| 28 | `button` | `button` | New to this | - | - | - | false | true |
| 29 | `button` | `button` | Some practice | - | - | - | false | true |
| 30 | `button` | `button` | Challenge me | - | - | - | false | true |
| 31 | `button` | `button` | Test mic | - | - | - | false | true |
| 32 | `button` | `button` | Allow microphone and start | - | - | - | false | true |
| 33 | `summary` | `summary` | SUMMARY | - | - | - | false | true |
| 34 | `button` | `button` | Back | - | - | - | false | true |
| 35 | `a` | `a` | How it works | - | - | - | false | true |
| 36 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 37 | `a` | `a` | For employers | - | - | - | false | true |
| 38 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 39 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 40 | `a` | `a` | System health | - | - | - | false | true |
| 41 | `a` | `a` | Integrations | - | - | - | false | true |
| 42 | `a` | `a` | Learn | - | - | - | false | true |
| 43 | `a` | `a` | Challenge | - | - | - | false | true |
| 44 | `a` | `a` | Explain | - | - | - | false | true |
| 45 | `a` | `a` | Passport | - | - | - | false | true |
| 46 | `a` | `a` | Connect | - | - | - | false | true |
| 47 | `button` | `button` | HELP | Help | - | - | false | true |

### `/session`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | How it works | - | - | - | false | true |
| 16 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 17 | `a` | `a` | For employers | - | - | - | false | true |
| 18 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 19 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 20 | `a` | `a` | System health | - | - | - | false | true |
| 21 | `a` | `a` | Integrations | - | - | - | false | true |
| 22 | `a` | `a` | Learn | - | - | - | false | true |
| 23 | `a` | `a` | Challenge | - | - | - | false | true |
| 24 | `a` | `a` | Explain | - | - | - | false | true |
| 25 | `a` | `a` | Passport | - | - | - | false | true |
| 26 | `a` | `a` | Connect | - | - | - | false | true |
| 27 | `button` | `button` | HELP | Help | - | - | false | true |

### `/results/att_demo_retail_01`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `button` | `button` | Weights | Explain ECVE weights | - | - | false | true |
| 23 | `button` | `button` | ISSUE MY SKILL PASSPORT | - | - | - | false | true |
| 24 | `a` | `a` | Start again | - | - | - | false | true |
| 25 | `a` | `a` | How it works | - | - | - | false | true |
| 26 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 27 | `a` | `a` | For employers | - | - | - | false | true |
| 28 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 29 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 30 | `a` | `a` | System health | - | - | - | false | true |
| 31 | `a` | `a` | Integrations | - | - | - | false | true |
| 32 | `a` | `a` | Learn | - | - | - | false | true |
| 33 | `a` | `a` | Challenge | - | - | - | false | true |
| 34 | `a` | `a` | Explain | - | - | - | false | true |
| 35 | `a` | `a` | Passport | - | - | - | false | true |
| 36 | `a` | `a` | Connect | - | - | - | false | true |
| 37 | `button` | `button` | HELP | Help | - | - | false | true |

### `/passport/att_demo_retail_01`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | - | QR code linking to /p/att_demo_retail_01 | - | - | false | true |
| 16 | `button` | `button` | COPY | Copy artifact SHA-256 | - | - | false | true |
| 17 | `button` | `button` | COPY | Copy JWS key ID | - | - | false | true |
| 18 | `a` | `a` | Verify independently | - | - | - | false | true |
| 19 | `button` | `switch` | Only you can see this until you share | - | - | - | false | true |
| 20 | `button` | `button` | COPY LINK | Copy passport link | - | - | false | true |
| 21 | `button` | `button` | DOWNLOAD AS IMAGE | - | - | - | false | true |
| 22 | `button` | `button` | WITHDRAW | - | - | - | false | true |
| 23 | `a` | `a` | Discover matching opportunities | - | - | - | false | true |
| 24 | `a` | `a` | How it works | - | - | - | false | true |
| 25 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 26 | `a` | `a` | For employers | - | - | - | false | true |
| 27 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 28 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 29 | `a` | `a` | System health | - | - | - | false | true |
| 30 | `a` | `a` | Integrations | - | - | - | false | true |
| 31 | `a` | `a` | Learn | - | - | - | false | true |
| 32 | `a` | `a` | Challenge | - | - | - | false | true |
| 33 | `a` | `a` | Explain | - | - | - | false | true |
| 34 | `a` | `a` | Passport | - | - | - | false | true |
| 35 | `a` | `a` | Connect | - | - | - | false | true |
| 36 | `button` | `button` | HELP | Help | - | - | false | true |

### `/opportunities`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `button` | `button` | All | - | - | - | false | true |
| 23 | `button` | `button` | Nearby | - | - | - | false | true |
| 24 | `button` | `button` | Entry-level | - | - | - | false | true |
| 25 | `button` | `button` | Language | - | - | - | false | true |
| 26 | `select` | `select` | All rolesEntry-Level Data Entry Operator | - | - | opp-role-filter | false | true |
| 27 | `input` | `input` | e.g. Hubballi or 580020 | - | - | opp-location-filter | false | true |
| 28 | `button` | `button` | Use GPS location (Optional) | - | - | - | false | true |
| 29 | `button` | `button` | Whitespace Trimming | - | - | - | false | true |
| 30 | `button` | `button` | ISO Date Standardization | - | - | - | false | true |
| 31 | `button` | `button` | Summary Formulas (=SUM, =AVERAGE) | - | - | - | false | true |
| 32 | `summary` | `summary` | Requirement weights | - | - | - | false | true |
| 33 | `button` | `button` | Whitespace Trimming | - | - | - | false | true |
| 34 | `button` | `button` | Summary Formulas (=SUM, =AVERAGE) | - | - | - | false | true |
| 35 | `button` | `button` | Quality Spot-Checking | - | - | - | false | true |
| 36 | `a` | `a` | Practise now | - | - | - | false | true |
| 37 | `summary` | `summary` | Requirement weights | - | - | - | false | true |
| 38 | `button` | `button` | Whitespace Trimming | - | - | - | false | true |
| 39 | `button` | `button` | ISO Date Standardization | - | - | - | false | true |
| 40 | `button` | `button` | Missing Value Handling | - | - | - | false | true |
| 41 | `a` | `a` | Practise now | - | - | - | false | true |
| 42 | `summary` | `summary` | Requirement weights | - | - | - | false | true |
| 43 | `a` | `a` | How it works | - | - | - | false | true |
| 44 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 45 | `a` | `a` | For employers | - | - | - | false | true |
| 46 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 47 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 48 | `a` | `a` | System health | - | - | - | false | true |
| 49 | `a` | `a` | Integrations | - | - | - | false | true |
| 50 | `a` | `a` | Learn | - | - | - | false | true |
| 51 | `a` | `a` | Challenge | - | - | - | false | true |
| 52 | `a` | `a` | Explain | - | - | - | false | true |
| 53 | `a` | `a` | Passport | - | - | - | false | true |
| 54 | `a` | `a` | Connect | - | - | - | false | true |
| 55 | `button` | `button` | HELP | Help | - | - | false | true |

### `/integrations`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Prooffolio | - | - | - | false | true |
| 16 | `a` | `a` | Jobs | - | - | - | false | true |
| 17 | `a` | `a` | 1. Learn | - | - | - | false | true |
| 18 | `a` | `a` | 2. Demonstrate | - | - | - | false | true |
| 19 | `a` | `a` | 3. Explain | - | - | - | false | true |
| 20 | `a` | `a` | 4. Verify | - | - | - | false | true |
| 21 | `a` | `a` | 5. Connect | - | - | - | false | true |
| 22 | `a` | `a` | Open System Health (/health) | - | - | - | false | true |
| 23 | `a` | `a` | Back to Home | - | - | - | false | true |
| 24 | `a` | `a` | How it works | - | - | - | false | true |
| 25 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 26 | `a` | `a` | For employers | - | - | - | false | true |
| 27 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 28 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 29 | `a` | `a` | System health | - | - | - | false | true |
| 30 | `a` | `a` | Integrations | - | - | - | false | true |
| 31 | `a` | `a` | Learn | - | - | - | false | true |
| 32 | `a` | `a` | Challenge | - | - | - | false | true |
| 33 | `a` | `a` | Explain | - | - | - | false | true |
| 34 | `a` | `a` | Passport | - | - | - | false | true |
| 35 | `a` | `a` | Connect | - | - | - | false | true |
| 36 | `button` | `button` | HELP | Help | - | - | false | true |

### `/health`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `button` | `button` | Try again | - | - | - | false | true |
| 16 | `button` | `button` | Run test session | - | - | - | false | true |
| 17 | `a` | `a` | Back to home | - | - | - | false | true |
| 18 | `a` | `a` | How it works | - | - | - | false | true |
| 19 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 20 | `a` | `a` | For employers | - | - | - | false | true |
| 21 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 22 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 23 | `a` | `a` | System health | - | - | - | false | true |
| 24 | `a` | `a` | Integrations | - | - | - | false | true |
| 25 | `a` | `a` | Learn | - | - | - | false | true |
| 26 | `a` | `a` | Challenge | - | - | - | false | true |
| 27 | `a` | `a` | Explain | - | - | - | false | true |
| 28 | `a` | `a` | Passport | - | - | - | false | true |
| 29 | `a` | `a` | Connect | - | - | - | false | true |
| 30 | `button` | `button` | HELP | Help | - | - | false | true |

### `/nonexistent-404`

| # | Tag | Role | Label | aria-label | data-testid | id | Disabled | 360 Visible |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `a` | `a` | Skip to content | - | - | - | false | true |
| 2 | `button` | `button` | - | Dismiss announcement | - | - | false | true |
| 3 | `a` | `a` | PROOFFOLIO | - | - | - | false | true |
| 4 | `a` | `a` | How it works | - | - | - | false | false |
| 5 | `a` | `a` | For learners | - | - | - | false | false |
| 6 | `a` | `a` | For employers | - | - | - | false | false |
| 7 | `a` | `a` | Verify | - | - | - | false | false |
| 8 | `button` | `button` | EN | English | - | - | false | true |
| 9 | `button` | `button` | हिं | हिन्दी | - | - | false | true |
| 10 | `button` | `button` | ಕನ್ನಡ | ಕನ್ನಡ | - | - | false | true |
| 11 | `button` | `button` | - | Search site (/) | - | - | false | true |
| 12 | `button` | `button` | - | Switch to dark mode | - | - | false | true |
| 13 | `a` | `a` | - | For learners | - | - | false | true |
| 14 | `button` | `button` | - | Toggle navigation menu | - | - | false | true |
| 15 | `a` | `a` | Return home → | - | - | - | false | true |
| 16 | `a` | `a` | BACK HOME | - | - | - | false | true |
| 17 | `a` | `a` | How it works | - | - | - | false | true |
| 18 | `a` | `a` | Demonstrate (.xlsx) | - | - | - | false | true |
| 19 | `a` | `a` | For employers | - | - | - | false | true |
| 20 | `a` | `a` | Sample Skill Passport | - | - | - | false | true |
| 21 | `a` | `a` | JWKS Public Keys | - | - | - | false | true |
| 22 | `a` | `a` | System health | - | - | - | false | true |
| 23 | `a` | `a` | Integrations | - | - | - | false | true |
| 24 | `a` | `a` | Learn | - | - | - | false | true |
| 25 | `a` | `a` | Challenge | - | - | - | false | true |
| 26 | `a` | `a` | Explain | - | - | - | false | true |
| 27 | `a` | `a` | Passport | - | - | - | false | true |
| 28 | `a` | `a` | Connect | - | - | - | false | true |
| 29 | `button` | `button` | HELP | Help | - | - | false | true |
