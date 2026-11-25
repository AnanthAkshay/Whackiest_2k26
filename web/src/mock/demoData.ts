import type {
  ChallengeInfo,
  ECVEResultUI,
  LearnerProfileUI,
  LearningCard,
  OpportunityItem,
  RoleOption,
  ValidationReportUI
} from "../types";

export const DEMO_LEARNER_PROFILE: LearnerProfileUI = {
  displayName: "Ananya Kumar",
  careerGoal: "Entry-Level Data Entry Operator",
  preferredLanguage: "en",
  coarseLocation: "Hubballi, Dharwad",
  isDemoData: true
};

export const MVP_ROLES: RoleOption[] = [
  {
    roleId: "data_entry_operator",
    title: "Entry-Level Data Entry Operator",
    sector: "Retail & Supply Chain Logistics",
    description:
      "Clean messy sales logs, standardize dates and customer names, handle missing entries, and compute summary totals in spreadsheets.",
    skills: [
      "Whitespace Trimming",
      "ISO Date Standardization",
      "Missing Value Handling",
      "Summary Formulas (=SUM, =AVERAGE, =COUNTIF)"
    ]
  }
];

export const LEARNING_CARDS: LearningCard[] = [
  {
    id: "card-whitespace",
    title: "1. Trim extra spaces & fix casing",
    summary:
      "Messy exports often have leading or trailing spaces in customer names. Use =TRIM(text) and =PROPER(text) so names match cleanly.",
    example: "=TRIM(PROPER(C2)) turns '  ravi kumar ' into 'Ravi Kumar'.",
    minutes: 3
  },
  {
    id: "card-dates",
    title: "2. Standardize dates to YYYY-MM-DD",
    summary:
      "Mixed date formats like 12/05/2026 and 2026.05.12 break sorting. Format date columns consistently as ISO YYYY-MM-DD.",
    example: "2026-05-12 sorts chronologically in every spreadsheet tool.",
    minutes: 4
  },
  {
    id: "card-formulas",
    title: "3. Summary formulas (=SUM, =AVERAGE, =COUNTIF)",
    summary:
      "Use formulas instead of typing totals by hand so figures update automatically if a row changes.",
    example: "=SUM(E2:E101) for total sales; =COUNTIF(D2:D101, \"Electronics\") for category counts.",
    minutes: 5
  }
];

export function getTrybPracticeUrl(): string {
  const configured = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_TRYB_PRACTICE_URL;
  return configured?.trim() ?? "";
}

export function getDevnovateUrl(): string {
  const configured = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_DEVNOVATE_URL;
  return configured?.trim() ?? "";
}

export const MVP_CHALLENGE: ChallengeInfo = {
  challengeId: "retail_sales_cleanup",
  roleId: "data_entry_operator",
  title: "Retail Sales Cleanup & Reporting",
  version: "1.0.0",
  rubricVersion: "1.0.0",
  acceptedFormat: ".xlsx",
  maxSizeMb: 10,
  estimatedSteps: [
    "1. Download or inspect the messy retail sales spreadsheet (100 rows).",
    "2. Remove extra spaces in Customer Name and Category columns.",
    "3. Convert all mixed dates into YYYY-MM-DD format.",
    "4. Add =SUM, =AVERAGE, and =COUNTIF summary formulas and upload your .xlsx file."
  ],
  instructions:
    "Prepare a clean, accurate retail sales workbook in .xlsx format (up to 10 MB). Objective checks will inspect your spreadsheet structure and formulas before your AI Viva."
};

export function createMockValidationReport(fileName: string, fileSizeBytes: number): ValidationReportUI {
  const isDemoCleaned = fileName.toLowerCase().includes("clean") || fileName.toLowerCase().includes("demo");
  return {
    attemptId: "att_demo_retail_01",
    fileName,
    fileSizeBytes,
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    practicalScore: isDemoCleaned ? 88 : 76,
    validatorVersion: "1.0.0-mock",
    isMock: true,
    checks: [
      {
        id: "chk-format",
        title: "Workbook format & required columns",
        explanation: "Checks that your file is a readable .xlsx workbook with Order ID, Date, Customer Name, Category, and Amount.",
        status: "pass",
        detail: "All 5 expected columns found."
      },
      {
        id: "chk-trim",
        title: "Customer name whitespace cleanup",
        explanation: "Checks that extra spaces at the start or end of customer names were removed.",
        status: "pass",
        detail: "0 rows with leading/trailing spaces detected."
      },
      {
        id: "chk-dates",
        title: "ISO Date standardization (YYYY-MM-DD)",
        explanation: "Checks that dates use a consistent YYYY-MM-DD format so they sort properly.",
        status: isDemoCleaned ? "pass" : "issue",
        detail: isDemoCleaned
          ? "All 100 date cells follow YYYY-MM-DD."
          : "4 rows still use DD/MM/YYYY text format."
      },
      {
        id: "chk-formulas",
        title: "Summary formulas (=SUM, =AVERAGE, =COUNTIF)",
        explanation: "Checks that summary cells use live formulas instead of typed numbers.",
        status: "pass",
        detail: "Found =SUM(E2:E101) and =AVERAGE(E2:E101) in Summary tab."
      },
      {
        id: "chk-macros",
        title: "Optional VBA macros",
        explanation: "Macros are not needed for this entry-level data entry task.",
        status: "not_applicable",
        detail: "Not required for Retail Sales Cleanup & Reporting."
      }
    ]
  };
}

export function computeECVEResult(practicalScore: number, vivaScore: number, consistencyScore = 85): ECVEResultUI {
  const P = Math.max(0, Math.min(100, Math.round(practicalScore)));
  const U = Math.max(0, Math.min(100, Math.round(vivaScore)));
  const C = Math.max(0, Math.min(100, Math.round(consistencyScore)));
  const composite = Math.round(0.6 * P + 0.25 * U + 0.15 * C);
  const criticalGatesPassed = P >= 60 && U >= 40;

  let outcome: ECVEResultUI["outcome"] = "Not yet demonstrated";
  let reviewExplanation =
    "Composite score is below 40 or critical evidence is missing. Review the feedback and try again.";

  if (C < 50) {
    outcome = "Pending Human Review";
    reviewExplanation =
      "Your spoken explanation differed from the submitted file facts. This is a review signal (not proof of cheating) and is routed for fair human review.";
  } else if (composite >= 75 && criticalGatesPassed) {
    outcome = "Demonstrated";
    reviewExplanation =
      "Composite >= 75, all critical gates passed, and spoken explanation is consistent with the file. Eligible for Skill Passport issuance.";
  } else if (composite >= 40) {
    outcome = "Partially demonstrated";
    reviewExplanation =
      "You showed partial competency (40 to <75, or a critical gate was not met). Practise the flagged areas before re-attempting.";
  }

  return {
    attemptId: "att_demo_retail_01",
    P,
    U,
    C,
    composite,
    criticalGatesPassed,
    outcome,
    reviewExplanation,
    isMock: true
  };
}

export const SAMPLE_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp_sample_hubballi_01",
    title: "Data Entry Associate (Retail Inventory)",
    employer: "Kaveri Supply & Retail Logistics",
    roleId: "data_entry_operator",
    district: "Dharwad",
    city: "Hubballi",
    pincode: "580020",
    sourceLabel: "Sample Local Listing (Demo)",
    isSample: true,
    postedDate: "2026-11-20",
    requiredSkills: [
      { skillId: "spreadsheet_hygiene", label: "Whitespace Trimming", weight: 35, matched: true },
      { skillId: "date_normalization", label: "ISO Date Standardization", weight: 35, matched: true },
      { skillId: "summary_aggregation", label: "Summary Formulas (=SUM, =AVERAGE)", weight: 30, matched: true }
    ],
    recommendedPractice: "Keep practising =COUNTIF category breakdowns."
  },
  {
    id: "opp_sample_bengaluru_02",
    title: "Junior Dispatch & Spreadsheet Clerk",
    employer: "Namma Mart Regional Fulfillment",
    roleId: "data_entry_operator",
    district: "Bengaluru Urban",
    city: "Bengaluru",
    pincode: "560001",
    sourceLabel: "Sample Partner Listing (Demo)",
    isSample: true,
    postedDate: "2026-11-22",
    requiredSkills: [
      { skillId: "spreadsheet_hygiene", label: "Whitespace Trimming", weight: 30, matched: true },
      { skillId: "summary_aggregation", label: "Summary Formulas (=SUM, =AVERAGE)", weight: 40, matched: true },
      { skillId: "spot_checking", label: "Quality Spot-Checking", weight: 30, matched: false }
    ],
    recommendedPractice: "Practise spot-checking row counts against summary totals in Learn & Practise."
  },
  {
    id: "opp_sample_mysuru_03",
    title: "Catalog Data Entry Specialist",
    employer: "Chamundi Artisan Collective",
    roleId: "data_entry_operator",
    district: "Mysuru",
    city: "Mysuru",
    pincode: "570001",
    sourceLabel: "Sample Local Listing (Demo)",
    isSample: true,
    postedDate: "2026-11-23",
    requiredSkills: [
      { skillId: "spreadsheet_hygiene", label: "Whitespace Trimming", weight: 40, matched: true },
      { skillId: "missing_value_handling", label: "Missing Value Handling", weight: 30, matched: false },
      { skillId: "date_normalization", label: "ISO Date Standardization", weight: 30, matched: true }
    ],
    recommendedPractice: "Review missing value imputation rules for blank categories."
  }
];
