import type {
  Challenge,
  ChallengeRubric,
  ConsentRecord,
  DatasetSeed,
  LearnerProfile,
  LearningResource,
  Opportunity,
  Role,
  Skill
} from "./types";

export const sampleLearner: LearnerProfile = {
  userId: "cand_fictional_ananya_01",
  publicHandle: "ananya_k",
  displayName: "Ananya Kumar",
  preferredLanguage: "kn",
  careerGoal: "Entry-Level Data Entry Operator in retail and logistics hubs",
  coarseLocation: {
    country: "India",
    state: "Karnataka",
    district: "Dharwad",
    city: "Hubballi"
  },
  createdAt: "2026-11-25T00:00:00.000Z"
};

export const sampleConsent: ConsentRecord = {
  consentId: "consent_ananya_2026",
  userId: "cand_fictional_ananya_01",
  policyVersion: "2026.1",
  aiProcessingConsent: true,
  voiceRetentionConsent: false,
  publicSharingConsent: true,
  grantedAt: "2026-11-25T00:01:00.000Z",
  withdrawnAt: null
};

export const sampleSkills: Skill[] = [
  {
    skillId: "spreadsheet_hygiene",
    name: "Spreadsheet Hygiene & Trimming",
    category: "Data Preparation",
    description: "Trimming whitespace, removing redundant rows, and standardizing text casing.",
    version: "1.0.0"
  },
  {
    skillId: "date_normalization",
    name: "Date Normalization",
    category: "Data Preparation",
    description: "Standardizing mixed text and slash dates into ISO standard YYYY-MM-DD.",
    version: "1.0.0"
  },
  {
    skillId: "missing_value_handling",
    name: "Missing Value Handling",
    category: "Data Integrity",
    description: "Imputing default categories or flagging incomplete order entries cleanly.",
    version: "1.0.0"
  },
  {
    skillId: "summary_aggregation",
    name: "Summary Aggregation Formulas",
    category: "Analysis",
    description: "Applying SUM, AVERAGE, and COUNTIF to compute categorical and overall sales totals.",
    version: "1.0.0"
  },
  {
    skillId: "spot_checking",
    name: "Quality Spot-Checking",
    category: "Verification",
    description: "Verifying computed totals against raw line items and explaining cross-checks.",
    version: "1.0.0"
  }
];

export const sampleRole: Role = {
  roleId: "data_entry_operator",
  title: "Entry-Level Data Entry Operator",
  description:
    "Performs routine data intake, spreadsheet hygiene, validation, and summary reporting for retail operations.",
  sector: "Retail & Supply Chain Logistics",
  version: "1.0.0",
  skills: [
    { roleId: "data_entry_operator", skillId: "spreadsheet_hygiene", weight: 0.25, criticalFlag: true, minimumScore: 70 },
    { roleId: "data_entry_operator", skillId: "date_normalization", weight: 0.25, criticalFlag: true, minimumScore: 70 },
    { roleId: "data_entry_operator", skillId: "missing_value_handling", weight: 0.15, criticalFlag: false, minimumScore: 60 },
    { roleId: "data_entry_operator", skillId: "summary_aggregation", weight: 0.25, criticalFlag: true, minimumScore: 70 },
    { roleId: "data_entry_operator", skillId: "spot_checking", weight: 0.10, criticalFlag: false, minimumScore: 50 }
  ],
  createdAt: "2026-11-25T00:00:00.000Z"
};

export const sampleChallenge: Challenge = {
  challengeId: "retail_sales_cleanup",
  roleId: "data_entry_operator",
  title: "Retail Sales Cleanup & Reporting",
  description:
    "Clean a messy 100-row retail sales log: fix whitespace, standardize dates to YYYY-MM-DD, impute missing categories, and calculate summary sales figures.",
  version: "1.0.0",
  taskPrompt:
    "Download retail_sales_messy.xlsx, normalize dates, clean names, and fill the summary tab with =SUM, =AVERAGE, and =COUNTIF formulas.",
  allowedFormats: [".xlsx"],
  skillRubricId: "excel_data_entry_v1",
  challengeRubricId: "retail_cleanup_v1",
  expectedOutputs: {
    expectedRows: 100,
    requiredColumns: ["Order ID", "Date", "Customer Name", "Category", "Amount"],
    requiredFormulas: ["=SUM", "=AVERAGE", "=COUNTIF"]
  },
  createdAt: "2026-11-25T00:00:00.000Z"
};

export const sampleDatasetSeed: DatasetSeed = {
  seedId: "seed_retail_2026_01",
  challengeId: "retail_sales_cleanup",
  version: "1.0.0",
  generationConfig: {
    rowCount: 100,
    noisePercentage: 15,
    randomSeed: 42
  },
  storageKey: "seeds/retail_sales_messy_seed_01.xlsx",
  sha256: "8f4e2b10a9c6d3e8f7a1b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4",
  expectedOutputs: {
    totalRevenueExpected: 148250.0,
    averageOrderExpected: 1482.5,
    electronicsCountExpected: 38
  },
  createdAt: "2026-11-25T00:00:00.000Z"
};

export const sampleChallengeRubric: ChallengeRubric = {
  challengeRubricId: "retail_cleanup_v1",
  challengeId: "retail_sales_cleanup",
  version: "1.0.0",
  checks: [
    {
      checkId: "check_whitespace",
      name: "Whitespace Trimming",
      weight: 25,
      critical: true,
      description: "No leading or trailing whitespace in Customer Name and Category columns."
    },
    {
      checkId: "check_dates",
      name: "ISO Date Standardization",
      weight: 25,
      critical: true,
      description: "All dates formatted as standard YYYY-MM-DD strings or date serials."
    },
    {
      checkId: "check_missing_values",
      name: "Missing Value Imputation",
      weight: 15,
      critical: false,
      description: "Blank categories replaced with 'General' or correct store department."
    },
    {
      checkId: "check_summary_formulas",
      name: "Formula Calculations (=SUM, =AVERAGE)",
      weight: 35,
      critical: true,
      description: "Summary revenue and average calculated using valid uppercase Excel formulas."
    }
  ],
  createdAt: "2026-11-25T00:00:00.000Z"
};

export const sampleOpportunities: Opportunity[] = [
  {
    opportunityId: "opp_sample_retail_hubballi_01",
    title: "Data Entry Associate (Retail Inventory)",
    employer: "Kaveri Supply & Retail Logistics (Sample)",
    sourceUrl: "https://example.com/careers/sample-hubballi-entry",
    district: "Dharwad",
    location: "Hubballi, Karnataka",
    requiredSkills: [
      { skillId: "spreadsheet_hygiene", weight: 0.35, minimumScore: 70 },
      { skillId: "date_normalization", weight: 0.35, minimumScore: 70 },
      { skillId: "summary_aggregation", weight: 0.30, minimumScore: 70 }
    ],
    listingStatus: "active",
    isSample: true, // Clearly labelled sample
    postedDate: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-25T00:00:00.000Z"
  },
  {
    opportunityId: "opp_sample_logistics_bengaluru_02",
    title: "Junior Dispatch & Spreadsheet Clerk",
    employer: "Namma Mart Regional Fulfillment (Sample)",
    sourceUrl: "https://example.com/careers/sample-bengaluru-clerk",
    district: "Bengaluru Urban",
    location: "Bengaluru, Karnataka",
    requiredSkills: [
      { skillId: "spreadsheet_hygiene", weight: 0.30, minimumScore: 70 },
      { skillId: "summary_aggregation", weight: 0.40, minimumScore: 75 },
      { skillId: "spot_checking", weight: 0.30, minimumScore: 60 }
    ],
    listingStatus: "active",
    isSample: true, // Clearly labelled sample
    postedDate: "2026-11-22T00:00:00.000Z",
    updatedAt: "2026-11-25T00:00:00.000Z"
  },
  {
    opportunityId: "opp_sample_ecommerce_mysuru_03",
    title: "Catalog Data Entry Specialist",
    employer: "Chamundi Artisan Collective (Sample)",
    sourceUrl: "https://example.com/careers/sample-mysuru-catalog",
    district: "Mysuru",
    location: "Mysuru, Karnataka",
    requiredSkills: [
      { skillId: "spreadsheet_hygiene", weight: 0.40, minimumScore: 70 },
      { skillId: "missing_value_handling", weight: 0.30, minimumScore: 65 },
      { skillId: "date_normalization", weight: 0.30, minimumScore: 70 }
    ],
    listingStatus: "active",
    isSample: true, // Clearly labelled sample
    postedDate: "2026-11-23T00:00:00.000Z",
    updatedAt: "2026-11-25T00:00:00.000Z"
  }
];

export const sampleLearningResources: LearningResource[] = [
  {
    resourceId: "res_lesson_dates_01",
    roleId: "data_entry_operator",
    skillId: "date_normalization",
    title: "Micro-Lesson: Standardizing Dates in Spreadsheets",
    type: "micro_lesson",
    contentMarkdown:
      "# Date Normalization\n\nLearn how to convert mixed formats like `12/04/2026` and `2026.04.12` into standard `YYYY-MM-DD`.",
    estimatedMinutes: 5
  },
  {
    resourceId: "res_drill_whitespace_02",
    roleId: "data_entry_operator",
    skillId: "spreadsheet_hygiene",
    title: "Interactive Practice: Trimming Whitespace",
    type: "drill",
    contentMarkdown:
      "# Trimming Exercise\n\nUse `=TRIM(A2)` to remove unwanted spaces from customer names and shipping addresses.",
    estimatedMinutes: 7
  },
  {
    resourceId: "res_tryb_game_03",
    roleId: "data_entry_operator",
    title: "Optional Tryb Practice Drill",
    type: "external_link",
    externalUrl: "https://tryb.cc/practice/spreadsheet-speed",
    estimatedMinutes: 10
  }
];
