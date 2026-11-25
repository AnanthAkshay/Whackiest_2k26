import { createHash } from "node:crypto";
import type { DatasetSeed } from "../domain/types";
import { buildXlsxBuffer, type CellInput } from "./xlsxArchive";

export interface SyntheticOrderRow {
  orderId: string;
  date: string;
  customerName: string;
  category: string;
  amount: number | string;
}

export interface ExpectedRetailOutputs {
  uniqueOrderCount: number;
  duplicateRowCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  categoryCounts: Record<string, number>;
  requiredSheets: string[];
  requiredColumns: string[];
  requiredFormulas: string[];
}

export interface GeneratedChallengeBundle {
  seed: DatasetSeed;
  messyRows: SyntheticOrderRow[];
  starterWorkbook: Buffer;
  expectedOutputs: ExpectedRetailOutputs;
}

const SYNTHETIC_FIRST_NAMES = [
  "Aarav",
  "Diya",
  "Kiran",
  "Meera",
  "Rohan",
  "Sneha",
  "Vikram",
  "Kavya",
  "Arjun",
  "Nandini",
  "Pranav",
  "Pooja",
  "Sanjay",
  "Lakshmi",
  "Nikhil",
  "Ananya"
];

const SYNTHETIC_LAST_INITIALS = ["K.", "S.", "R.", "M.", "P.", "N.", "V.", "B."];
const CATEGORIES = ["Electronics", "Grocery", "Home", "Stationery"] as const;

/**
 * Deterministic PRNG (Mulberry32) seeded from a string seedId.
 */
function createDeterministicRng(seedId: string): () => number {
  const hash = createHash("sha256").update(seedId).digest();
  let state = hash.readUInt32LE(0);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatInconsistentDate(day: number, month: number, year: number, styleIndex: number): string {
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  switch (styleIndex % 4) {
    case 0:
      return `${dd}/${mm}/${year}`;
    case 1:
      return `${year}.${mm}.${dd}`;
    case 2:
      return `${dd}-${months[month - 1]}-${year}`;
    default:
      return `${year}-${mm}-${dd}`;
  }
}

function formatInconsistentCurrency(amount: number, styleIndex: number): string | number {
  switch (styleIndex % 4) {
    case 0:
      return `Rs. ${amount.toLocaleString("en-IN")}`;
    case 1:
      return `INR ${amount}`;
    case 2:
      return ` ${amount} `;
    default:
      return amount;
  }
}

/**
 * Generates deterministic synthetic retail sales challenge data for an attempt seed.
 */
export function generateSeededChallengeDataset(
  seedId: string,
  challengeId = "retail_sales_cleanup",
  version = "1.0.0"
): GeneratedChallengeBundle {
  const rng = createDeterministicRng(seedId);
  const uniqueCount = 16;

  const cleanRows: Array<{
    orderId: string;
    isoDate: string;
    day: number;
    month: number;
    year: number;
    customerName: string;
    category: string;
    amount: number;
  }> = [];

  for (let i = 0; i < uniqueCount; i++) {
    const orderNum = 1001 + i;
    const day = 1 + Math.floor(rng() * 25);
    const month = 10;
    const year = 2026;
    const first = SYNTHETIC_FIRST_NAMES[(i + Math.floor(rng() * 4)) % SYNTHETIC_FIRST_NAMES.length];
    const last = SYNTHETIC_LAST_INITIALS[Math.floor(rng() * SYNTHETIC_LAST_INITIALS.length)];
    const category = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
    const amount = 250 + Math.floor(rng() * 25) * 50;

    cleanRows.push({
      orderId: `ORD-${orderNum}`,
      isoDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      month,
      year,
      customerName: `${first} ${last}`,
      category,
      amount
    });
  }

  // Expected outputs from clean unique rows (note: 2 rows have blank category -> imputed as "General")
  const imputedCategories = cleanRows.map((r, idx) => (idx === 3 || idx === 11 ? "General" : r.category));
  const categoryCounts: Record<string, number> = {
    Electronics: 0,
    Grocery: 0,
    Home: 0,
    Stationery: 0,
    General: 0
  };
  for (const cat of imputedCategories) {
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  const totalRevenue = cleanRows.reduce((sum, r) => sum + r.amount, 0);
  const averageOrderValue = Math.round((totalRevenue / cleanRows.length) * 100) / 100;

  // Build messy starter rows with controlled defects
  const messyRows: SyntheticOrderRow[] = cleanRows.map((r, idx) => ({
    orderId: r.orderId,
    date: formatInconsistentDate(r.day, r.month, r.year, idx),
    customerName: idx % 3 === 0 ? `  ${r.customerName.toLowerCase()}  ` : r.customerName,
    category: idx === 3 || idx === 11 ? "" : r.category,
    amount: formatInconsistentCurrency(r.amount, idx)
  }));

  // Inject 2 exact duplicate rows
  messyRows.push({ ...messyRows[2] });
  messyRows.push({ ...messyRows[7] });

  // Deterministically shuffle rows so starter sheet is unsorted
  for (let i = messyRows.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [messyRows[i], messyRows[j]] = [messyRows[j], messyRows[i]];
  }

  const starterSheetRows: CellInput[][] = [
    ["Order ID", "Date", "Customer Name", "Category", "Amount"],
    ...messyRows.map((r) => [r.orderId, r.date, r.customerName, r.category, r.amount])
  ];

  const starterSummaryRows: CellInput[][] = [
    ["Metric", "Value", "Instructions"],
    ["Total Revenue", "", "Use =SUM(...) over Sales_Data Amount column"],
    ["Average Order Value", "", "Use =AVERAGE(...) over Sales_Data Amount column"],
    ["Unique Order Count", "", "Count unique orders after removing duplicates"],
    ["Electronics Count", "", "Use =COUNTIF(Sales_Data!D2:D17, \"Electronics\")"],
    ["Grocery Count", "", "Use =COUNTIF(Sales_Data!D2:D17, \"Grocery\")"],
    ["Home Count", "", "Use =COUNTIF(Sales_Data!D2:D17, \"Home\")"],
    ["Stationery Count", "", "Use =COUNTIF(Sales_Data!D2:D17, \"Stationery\")"],
    ["General (Imputed) Count", "", "Use =COUNTIF(Sales_Data!D2:D17, \"General\")"]
  ];

  const starterWorkbook = buildXlsxBuffer([
    { name: "Sales_Data", rows: starterSheetRows },
    { name: "Summary", rows: starterSummaryRows }
  ]);

  const sha256 = createHash("sha256").update(starterWorkbook).digest("hex");

  const expectedOutputs: ExpectedRetailOutputs = {
    uniqueOrderCount: uniqueCount,
    duplicateRowCount: 2,
    totalRevenue,
    averageOrderValue,
    categoryCounts,
    requiredSheets: ["Sales_Data", "Summary"],
    requiredColumns: ["Order ID", "Date", "Customer Name", "Category", "Amount"],
    requiredFormulas: ["=SUM", "=AVERAGE", "=COUNTIF"]
  };

  const seed: DatasetSeed = {
    seedId,
    challengeId,
    version,
    generationConfig: {
      uniqueRows: uniqueCount,
      duplicateRows: 2,
      missingCategoryRows: 2,
      syntheticOnly: true
    },
    storageKey: `seeds/${seedId}.xlsx`,
    sha256,
    expectedOutputs: expectedOutputs as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString()
  };

  return {
    seed,
    messyRows,
    starterWorkbook,
    expectedOutputs
  };
}

/**
 * Builds a completed reference workbook strictly for automated tests and demo fixtures.
 * NEVER expose this in the learner's normal challenge flow.
 */
export function buildReferenceWorkbookForTest(seedId: string): {
  buffer: Buffer;
  expectedOutputs: ExpectedRetailOutputs;
} {
  const rng = createDeterministicRng(seedId);
  const uniqueCount = 16;
  const cleanRows: Array<{
    orderId: string;
    isoDate: string;
    customerName: string;
    category: string;
    amount: number;
  }> = [];

  for (let i = 0; i < uniqueCount; i++) {
    const orderNum = 1001 + i;
    const day = 1 + Math.floor(rng() * 25);
    const month = 10;
    const year = 2026;
    const first = SYNTHETIC_FIRST_NAMES[(i + Math.floor(rng() * 4)) % SYNTHETIC_FIRST_NAMES.length];
    const last = SYNTHETIC_LAST_INITIALS[Math.floor(rng() * SYNTHETIC_LAST_INITIALS.length)];
    const rawCategory = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
    const amount = 250 + Math.floor(rng() * 25) * 50;

    cleanRows.push({
      orderId: `ORD-${orderNum}`,
      isoDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      customerName: `${first} ${last}`,
      category: i === 3 || i === 11 ? "General" : rawCategory,
      amount
    });
  }

  cleanRows.sort((a, b) => a.orderId.localeCompare(b.orderId));

  const categoryCounts: Record<string, number> = {
    Electronics: 0,
    Grocery: 0,
    Home: 0,
    Stationery: 0,
    General: 0
  };
  for (const r of cleanRows) {
    categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
  }

  const totalRevenue = cleanRows.reduce((sum, r) => sum + r.amount, 0);
  const averageOrderValue = Math.round((totalRevenue / cleanRows.length) * 100) / 100;

  const salesRows: CellInput[][] = [
    ["Order ID", "Date", "Customer Name", "Category", "Amount"],
    ...cleanRows.map((r) => [r.orderId, r.isoDate, r.customerName, r.category, r.amount])
  ];

  const summaryRows: CellInput[][] = [
    ["Metric", "Value"],
    ["Total Revenue", { formula: "SUM(Sales_Data!E2:E17)", value: totalRevenue }],
    ["Average Order Value", { formula: "AVERAGE(Sales_Data!E2:E17)", value: averageOrderValue }],
    ["Unique Order Count", { formula: "COUNTA(Sales_Data!A2:A17)", value: uniqueCount }],
    ["Electronics Count", { formula: 'COUNTIF(Sales_Data!D2:D17,"Electronics")', value: categoryCounts.Electronics }],
    ["Grocery Count", { formula: 'COUNTIF(Sales_Data!D2:D17,"Grocery")', value: categoryCounts.Grocery }],
    ["Home Count", { formula: 'COUNTIF(Sales_Data!D2:D17,"Home")', value: categoryCounts.Home }],
    ["Stationery Count", { formula: 'COUNTIF(Sales_Data!D2:D17,"Stationery")', value: categoryCounts.Stationery }],
    ["General (Imputed) Count", { formula: 'COUNTIF(Sales_Data!D2:D17,"General")', value: categoryCounts.General }]
  ];

  const buffer = buildXlsxBuffer([
    { name: "Sales_Data", rows: salesRows },
    { name: "Summary", rows: summaryRows }
  ]);

  return {
    buffer,
    expectedOutputs: {
      uniqueOrderCount: uniqueCount,
      duplicateRowCount: 2,
      totalRevenue,
      averageOrderValue,
      categoryCounts,
      requiredSheets: ["Sales_Data", "Summary"],
      requiredColumns: ["Order ID", "Date", "Customer Name", "Category", "Amount"],
      requiredFormulas: ["=SUM", "=AVERAGE", "=COUNTIF"]
    }
  };
}
