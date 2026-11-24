# Bluff Test Harness Report (NFR-05)

> [!NOTE]
> **Data Grounding & Honesty Disclosure**
> **These are scripted transcripts, not pilot data.**
> The Excel rubric is built from public sources (Microsoft MO-200 skills outline and Microsoft Support documentation). Trainer co-sign is planned in the pilot.

## Executive Summary

- **Harness Status**: **PASS**
- **Score Gap**: **63.2 points** (Target: $\ge 25$ points)
- **Score Midpoint**: **39.5**
- **Bluffer Early Check Separation**: **10 / 10** fall at or below midpoint (Target: $\ge 8 / 10$)
- **Genuine Candidate Early Check Separation**: **10 / 10** fall at or above midpoint (Target: $\ge 8 / 10$)

| Metric | Bluffer Group (N=10) | Genuine Candidate Group (N=10) | Difference / Target | Status |
|---|---|---|---|---|
| **Mean Total Score** | **7.9** | **71.1** | **+63.2 pts** (Target $\ge 25$) | **PASS** |
| **Mean Final Meter** | **7.7** | **71** | **+63.3 pts** | **PASS** |
| **Midpoint Separation** | **10 / 10** $\le 39.5$ | **10 / 10** $\ge 39.5$ | Target $\ge 8 / 10$ each | **PASS** |

---

## Detailed Transcript Results

### 1. Scripted Bluffer Transcripts (N=10)
*Characteristics: High-confidence buzzwords, corporate jargon, tautologies, missing concrete Excel syntax, zero concrete examples.*

| ID | Persona | Final Meter | Total Score | Level | Stalled | Midpoint Check ($\le 39.5$) |
|---|---|---|---|---|---|---|
| `bluffer-01` | Enterprise Paradigm Architect | 13 | **13** | Starting | No | PASS |
| `bluffer-02` | Circular Tautologist | 25 | **25** | Starting | No | PASS |
| `bluffer-03` | AI & Big Data Name-Dropper | 0 | **0** | Starting | Yes | PASS |
| `bluffer-04` | Consulting Framework Pitcher | 5 | **5** | Starting | Yes | PASS |
| `bluffer-05` | The Vague Hand-Waver | 8 | **8** | Starting | No | PASS |
| `bluffer-06` | Misconception Confident Bluffer | 8 | **10** | Starting | Yes | PASS |
| `bluffer-07` | Menu Clicker & UI Guesser | 0 | **0** | Starting | Yes | PASS |
| `bluffer-08` | Echo Chamber Parakeet | 0 | **0** | Starting | Yes | PASS |
| `bluffer-09` | Executive Visionary | 18 | **18** | Starting | Yes | PASS |
| `bluffer-10` | Jargon Overloader | 0 | **0** | Starting | Yes | PASS |

### 2. Scripted Genuine Candidate Transcripts (N=10)
*Characteristics: Concrete cell coordinates ($A$1, B2:B20), formula syntax (=SUM, =IF, =AVERAGE), table sorting/filtering, number formatting, some realistic imperfections.*

| ID | Persona | Final Meter | Total Score | Level | Stalled | Midpoint Check ($\ge 39.5$) |
|---|---|---|---|---|---|---|
| `genuine-01` | Strong Technical Candidate | 95 | **95** | Ready to practise | No | PASS |
| `genuine-02` | Practical Financial Analyst | 72 | **73** | Developing | No | PASS |
| `genuine-03` | Imperfect But Clear Beginner | 80 | **80** | Ready to practise | No | PASS |
| `genuine-04` | Retail Inventory Manager | 50 | **50** | Developing | No | PASS |
| `genuine-05` | School Gradebook Teacher | 68 | **68** | Developing | No | PASS |
| `genuine-06` | Budgeting Assistant (Imperfect Syntax) | 60 | **60** | Developing | No | PASS |
| `genuine-07` | HR Operations Specialist | 70 | **70** | Developing | No | PASS |
| `genuine-08` | Customer Support Team Lead | 60 | **60** | Developing | No | PASS |
| `genuine-09` | Logistics Dispatcher | 85 | **85** | Ready to practise | No | PASS |
| `genuine-10` | Marketing Campaign Specialist | 70 | **70** | Developing | No | PASS |

---

## Evaluation Criteria & Scoring Behavior Analysis

1. **Jargon Suppression**: Candidates who use terms like "multi-tiered architecture", "paradigm", "relational topology", or "synergy" without specifying syntax or cell references trigger no rubric criteria, yielding scores near 0.
2. **Misconception Penalties**: Candidates who assert known misconceptions (e.g. formulas start with `#`, `$A$1` is relative and changes every time) receive penalty deductions against their overall meter and score.
3. **Genuine Evidence Rewarded**: Concrete syntax like `=SUM(A1:A10)`, `$A$1`, `=IF(B2>=50,"Pass","Fail")`, table header sorting, and percent formatting cleanly satisfy criteria, separating genuine candidates by an average of 63.2 points.

---
*Report generated automatically by `npm run test:bluff` on 2026-11-24T17:56:59.600Z.*
