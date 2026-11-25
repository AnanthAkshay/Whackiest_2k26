from __future__ import annotations

import datetime
import hashlib
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import openpyxl
import pandas as pd

from . import VALIDATOR_VERSION
from .schema import (
    CheckResultItem,
    ExpectedVsActualTotals,
    FactSheet,
    FormulaFact,
    QualitativeObservation,
    WorkbookStructure,
)

EXPECTED_SHEETS = ["Sales_Data", "Summary"]
EXPECTED_COLUMNS = ["Order ID", "Date", "Customer Name", "Category", "Amount"]
SUPPORTED_FUNCTIONS = {"SUM", "AVERAGE", "COUNTA", "COUNTIF"}
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
FORMULA_FUNC_RE = re.compile(r"^=?\s*([A-Za-z0-9_]+)\s*\(")


def compute_sha256(file_path: Path) -> str:
    h = hashlib.sha256()
    with file_path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _is_iso_date_value(val: Any) -> bool:
    if isinstance(val, (datetime.date, datetime.datetime)):
        return True
    if isinstance(val, str):
        s = val.strip()
        if not ISO_DATE_RE.match(s):
            return False
        try:
            datetime.date.fromisoformat(s)
            return True
        except ValueError:
            return False
    return False


def _is_numeric_amount(val: Any) -> bool:
    if isinstance(val, bool):
        return False
    if isinstance(val, (int, float)):
        return not pd.isna(val)
    return False


def _extract_formula_function(raw_val: Any) -> Optional[str]:
    if not isinstance(raw_val, str) or not raw_val.startswith("="):
        return None
    m = FORMULA_FUNC_RE.match(raw_val)
    return m.group(1).upper() if m else "UNKNOWN"


def validate_workbook(
    file_path: str | Path,
    attempt_id: str,
    artifact_id: str,
    expected_outputs: Optional[Dict[str, Any]] = None,
) -> FactSheet:
    path = Path(file_path)
    expected = expected_outputs or {}
    file_hash = compute_sha256(path)

    try:
        wb_formulas = openpyxl.load_workbook(path, data_only=False, keep_vba=False)
        wb_values = openpyxl.load_workbook(path, data_only=True, keep_vba=False)
    except Exception as exc:
        return FactSheet(
            attemptId=attempt_id,
            artifactId=artifact_id,
            validatorVersion=VALIDATOR_VERSION,
            fileHash=file_hash,
            status="parse_error",
            practicalScore=0.0,
            workbookStructure=WorkbookStructure(
                sheetNames=[],
                expectedSheetsPresent=False,
                salesDataHeaders=[],
                expectedHeadersMatch=False,
            ),
            checkResults=[],
            factIds=[],
            formulaFacts=[],
            rowCounts={},
            duplicateCounts={},
            expectedVsActualTotals=ExpectedVsActualTotals(
                expectedTotalRevenue=expected.get("totalRevenue"),
                expectedAverageOrder=expected.get("averageOrderValue"),
                expectedUniqueOrders=expected.get("uniqueOrderCount"),
            ),
            qualitativeObservations=[],
            warnings=[],
            errors=[f"Could not parse workbook safely: {type(exc).__name__}"],
        )

    sheet_names = list(wb_formulas.sheetnames)
    sheets_present = all(s in sheet_names for s in EXPECTED_SHEETS)

    sales_headers: List[str] = []
    if "Sales_Data" in sheet_names:
        ws_sales = wb_formulas["Sales_Data"]
        first_row = next(ws_sales.iter_rows(min_row=1, max_row=1, values_only=True), ())
        sales_headers = [str(c).strip() if c is not None else "" for c in first_row[: len(EXPECTED_COLUMNS)]]

    headers_match = sales_headers == EXPECTED_COLUMNS
    structure = WorkbookStructure(
        sheetNames=sheet_names,
        expectedSheetsPresent=sheets_present,
        salesDataHeaders=sales_headers,
        expectedHeadersMatch=headers_match,
    )

    check_results: List[CheckResultItem] = []
    fact_ids: List[str] = []
    formula_facts: List[FormulaFact] = []
    qualitative_obs: List[QualitativeObservation] = []
    warnings: List[str] = []
    errors: List[str] = []

    # 1. Workbook Structure & Required Sheets (20 pts)
    if sheets_present and headers_match:
        fact_ids.extend(["fact_sheets_present", "fact_headers_match"])
        check_results.append(
            CheckResultItem(
                checkId="chk_structure_sheets",
                name="Workbook Structure & Required Sheets",
                status="pass",
                critical=True,
                score=20.0,
                maxScore=20.0,
                sourceRef="Workbook!Sheets",
                explanation="Sales_Data and Summary sheets exist with all 5 expected header columns.",
            )
        )
    else:
        missing_sheets = [s for s in EXPECTED_SHEETS if s not in sheet_names]
        hint = (
            f"Add missing sheet(s): {', '.join(missing_sheets)}."
            if missing_sheets
            else f"Set Sales_Data row 1 headers to: {', '.join(EXPECTED_COLUMNS)}."
        )
        check_results.append(
            CheckResultItem(
                checkId="chk_structure_sheets",
                name="Workbook Structure & Required Sheets",
                status="fail",
                critical=True,
                score=0.0,
                maxScore=20.0,
                sourceRef="Sales_Data!A1:E1",
                explanation="Required sheets or exact Sales_Data headers are missing.",
                actionableHint=hint,
            )
        )
        return FactSheet(
            attemptId=attempt_id,
            artifactId=artifact_id,
            validatorVersion=VALIDATOR_VERSION,
            fileHash=file_hash,
            status="ok",
            practicalScore=0.0,
            workbookStructure=structure,
            checkResults=check_results,
            factIds=fact_ids,
            formulaFacts=[],
            rowCounts={"salesDataRows": 0},
            duplicateCounts={"duplicateOrderIds": 0},
            expectedVsActualTotals=ExpectedVsActualTotals(
                expectedTotalRevenue=expected.get("totalRevenue"),
                expectedAverageOrder=expected.get("averageOrderValue"),
                expectedUniqueOrders=expected.get("uniqueOrderCount"),
            ),
            qualitativeObservations=[],
            warnings=warnings,
            errors=errors,
        )

    # Read Sales_Data rows via openpyxl -> pandas DataFrame
    ws_sales_vals = wb_values["Sales_Data"]
    raw_rows: List[Tuple[Any, ...]] = []
    for row in ws_sales_vals.iter_rows(min_row=2, max_col=5, values_only=True):
        if any(cell is not None and str(cell).strip() != "" for cell in row):
            raw_rows.append(row)

    df = pd.DataFrame(raw_rows, columns=EXPECTED_COLUMNS)
    total_rows = int(len(df))

    # 2. Duplicate Order Removal (20 pts)
    order_ids = df["Order ID"].astype(str).str.strip()
    dup_count = int(order_ids.duplicated().sum()) if total_rows > 0 else 0
    unique_count = int(order_ids.nunique()) if total_rows > 0 else 0
    expected_unique = expected.get("uniqueOrderCount")

    dup_pass = dup_count == 0 and (expected_unique is None or unique_count == int(expected_unique))
    fact_ids.extend(["fact_unique_order_count", "fact_duplicates_removed"])
    check_results.append(
        CheckResultItem(
            checkId="chk_duplicates_removed",
            name="Duplicate Order Removal",
            status="pass" if dup_pass else "fail",
            critical=True,
            score=20.0 if dup_pass else 0.0,
            maxScore=20.0,
            sourceRef="Sales_Data!A2:A" + str(total_rows + 1),
            explanation=(
                f"Found {unique_count} unique orders with 0 duplicates."
                if dup_pass
                else f"Found {dup_count} duplicate Order ID(s) and {unique_count} unique orders."
            ),
            actionableHint=(
                None
                if dup_pass
                else "Use Data -> Remove Duplicates on Order ID so each order appears exactly once."
            ),
        )
    )

    # 3. Customer Name Hygiene (15 pts)
    bad_names = 0
    for val in df["Customer Name"]:
        if not isinstance(val, str) or val.strip() == "" or val != val.strip() or val == val.lower():
            bad_names += 1
    names_pass = total_rows > 0 and bad_names == 0
    fact_ids.append("fact_trimmed_names")
    check_results.append(
        CheckResultItem(
            checkId="chk_whitespace_casing",
            name="Customer Name Hygiene",
            status="pass" if names_pass else "fail",
            critical=False,
            score=15.0 if names_pass else (7.5 if bad_names <= 2 else 0.0),
            maxScore=15.0,
            sourceRef="Sales_Data!C2:C" + str(total_rows + 1),
            explanation=(
                "All Customer Name cells are trimmed and title-cased."
                if names_pass
                else f"{bad_names} Customer Name cell(s) have extra spaces or inconsistent casing."
            ),
            actionableHint=None if names_pass else "Apply =TRIM(PROPER(...)) to remove extra spaces and fix casing.",
        )
    )

    # 4. ISO Date Standardization (15 pts)
    bad_dates = sum(1 for val in df["Date"] if not _is_iso_date_value(val))
    dates_pass = total_rows > 0 and bad_dates == 0
    fact_ids.append("fact_dates_standardized")
    check_results.append(
        CheckResultItem(
            checkId="chk_date_normalization",
            name="ISO Date Standardization",
            status="pass" if dates_pass else "fail",
            critical=True,
            score=15.0 if dates_pass else 0.0,
            maxScore=15.0,
            sourceRef="Sales_Data!B2:B" + str(total_rows + 1),
            explanation=(
                "All Date cells follow ISO YYYY-MM-DD or valid Excel date format."
                if dates_pass
                else f"{bad_dates} Date cell(s) still use inconsistent formats."
            ),
            actionableHint=None if dates_pass else "Convert all Date cells to YYYY-MM-DD format.",
        )
    )

    # 5. Missing Values & Numeric Currency (10 pts)
    blank_categories = sum(
        1 for val in df["Category"] if val is None or str(val).strip() == "" or str(val).strip().lower() == "nan"
    )
    non_numeric_amounts = sum(1 for val in df["Amount"] if not _is_numeric_amount(val))
    currency_pass = total_rows > 0 and blank_categories == 0 and non_numeric_amounts == 0
    fact_ids.extend(["fact_missing_categories_imputed", "fact_numeric_amounts"])
    check_results.append(
        CheckResultItem(
            checkId="chk_missing_currency",
            name="Missing Values & Numeric Currency",
            status="pass" if currency_pass else "fail",
            critical=False,
            score=10.0 if currency_pass else (5.0 if (blank_categories == 0 or non_numeric_amounts == 0) else 0.0),
            maxScore=10.0,
            sourceRef="Sales_Data!D2:E" + str(total_rows + 1),
            explanation=(
                "All blank categories are filled and all Amount values are numeric."
                if currency_pass
                else f"Found {blank_categories} blank category cell(s) and {non_numeric_amounts} non-numeric Amount cell(s)."
            ),
            actionableHint=(
                None
                if currency_pass
                else "Fill blank Category cells with 'General' and remove text prefixes like 'Rs.' from Amount."
            ),
        )
    )

    # Compute actual totals from clean numeric Sales_Data rows
    numeric_amounts = [float(v) for v in df["Amount"] if _is_numeric_amount(v)]
    actual_total_rev = round(sum(numeric_amounts), 2) if numeric_amounts else None
    actual_avg_order = round(actual_total_rev / len(numeric_amounts), 2) if (actual_total_rev is not None and numeric_amounts) else None

    # Qualitative observation: check sort order without failing objective formula checks
    if total_rows > 1:
        order_list = list(order_ids)
        if order_list != sorted(order_list):
            qualitative_obs.append(
                QualitativeObservation(
                    factId="fact_sort_order",
                    sourceRef="Sales_Data!A2:A" + str(total_rows + 1),
                    message="Sales_Data rows are not sorted by Order ID (qualitative presentation note).",
                )
            )

    # 6. Summary Formulas & Result Checks (20 pts)
    ws_sum_f = wb_formulas["Summary"]
    ws_sum_v = wb_values["Summary"]

    summary_rows: Dict[str, Tuple[int, Any, Any]] = {}
    for idx in range(1, ws_sum_f.max_row + 1):
        label_cell = ws_sum_f.cell(row=idx, column=1).value
        if label_cell is not None:
            label = str(label_cell).strip().lower()
            summary_rows[label] = (idx, ws_sum_f.cell(row=idx, column=2).value, ws_sum_v.cell(row=idx, column=2).value)

    rev_entry = summary_rows.get("total revenue")
    avg_entry = summary_rows.get("average order value")
    countif_entries = [
        (k, v) for k, v in summary_rows.items()
        if "count" in k and isinstance(v[1], str) and "COUNTIF" in v[1].upper()
    ]

    formula_unknown = False
    formula_failed = False

    def inspect_formula_cell(
        fact_id: str,
        metric: str,
        entry: Optional[Tuple[int, Any, Any]],
        expected_val: Optional[float],
    ) -> None:
        nonlocal formula_unknown, formula_failed
        if not entry:
            formula_failed = True
            formula_facts.append(
                FormulaFact(
                    factId=fact_id,
                    metric=metric,
                    sourceRef="Summary!B",
                    formula=None,
                    supported=False,
                    cachedValue=None,
                    expectedValue=expected_val,
                    status="fail",
                )
            )
            return

        row_num, raw_f, cached_v = entry
        ref = f"Summary!B{row_num}"
        func_name = _extract_formula_function(raw_f)

        if func_name is None:
            formula_failed = True
            formula_facts.append(
                FormulaFact(
                    factId=fact_id,
                    metric=metric,
                    sourceRef=ref,
                    formula=str(raw_f) if raw_f is not None else None,
                    supported=False,
                    cachedValue=float(cached_v) if _is_numeric_amount(cached_v) else None,
                    expectedValue=expected_val,
                    status="fail",
                )
            )
            return

        if func_name not in SUPPORTED_FUNCTIONS:
            formula_unknown = True
            formula_facts.append(
                FormulaFact(
                    factId=fact_id,
                    metric=metric,
                    sourceRef=ref,
                    formula=str(raw_f),
                    supported=False,
                    cachedValue=float(cached_v) if _is_numeric_amount(cached_v) else None,
                    expectedValue=expected_val,
                    status="unknown",
                )
            )
            return

        cached_num = float(cached_v) if _is_numeric_amount(cached_v) else None
        if cached_num is None:
            # Formula exists and is supported, but Excel didn't cache a value -> mark unknown/review, never silent pass
            formula_unknown = True
            formula_facts.append(
                FormulaFact(
                    factId=fact_id,
                    metric=metric,
                    sourceRef=ref,
                    formula=str(raw_f),
                    supported=True,
                    cachedValue=None,
                    expectedValue=expected_val,
                    status="unknown",
                )
            )
            return

        if expected_val is not None and abs(cached_num - float(expected_val)) > 0.05:
            formula_failed = True
            formula_facts.append(
                FormulaFact(
                    factId=fact_id,
                    metric=metric,
                    sourceRef=ref,
                    formula=str(raw_f),
                    supported=True,
                    cachedValue=cached_num,
                    expectedValue=expected_val,
                    status="fail",
                )
            )
            return

        formula_facts.append(
            FormulaFact(
                factId=fact_id,
                metric=metric,
                sourceRef=ref,
                formula=str(raw_f),
                supported=True,
                cachedValue=cached_num,
                expectedValue=expected_val,
                status="pass",
            )
        )

    inspect_formula_cell("fact_total_revenue_match", "Total Revenue", rev_entry, expected.get("totalRevenue"))
    inspect_formula_cell("fact_average_order_match", "Average Order Value", avg_entry, expected.get("averageOrderValue"))

    if len(countif_entries) == 0:
        formula_failed = True
    else:
        for label_k, entry_v in countif_entries:
            inspect_formula_cell(f"fact_countif_{label_k.replace(' ', '_')}", label_k, entry_v, None)

    fact_ids.append("fact_summary_formulas")
    if formula_failed:
        sum_status = "fail"
        sum_score = 0.0
        sum_expl = "Summary sheet is missing live =SUM/=AVERAGE/=COUNTIF formulas or formula results do not match expected totals."
        sum_hint = "Use =SUM, =AVERAGE, and =COUNTIF formulas in Summary!B and ensure calculated values match Sales_Data."
    elif formula_unknown:
        sum_status = "unknown"
        sum_score = 0.0
        sum_expl = "A summary formula could not be evaluated safely or uses an unsupported function; routed for review."
        sum_hint = "Use standard =SUM, =AVERAGE, and =COUNTIF formulas and save the workbook after recalculation."
        warnings.append("Unsupported or uncached formula in Summary sheet requires review.")
    else:
        sum_status = "pass"
        sum_score = 20.0
        sum_expl = "Summary sheet uses live supported formulas (=SUM, =AVERAGE, =COUNTIF) matching expected totals."
        sum_hint = None

    check_results.append(
        CheckResultItem(
            checkId="chk_summary_formulas",
            name="Summary Formulas (=SUM, =AVERAGE, =COUNTIF)",
            status=sum_status,
            critical=True,
            score=sum_score,
            maxScore=20.0,
            sourceRef="Summary!B2:B9",
            explanation=sum_expl,
            actionableHint=sum_hint,
        )
    )

    practical_score = round(sum(c.score for c in check_results), 2)
    overall_status = "review_required" if formula_unknown else "ok"

    return FactSheet(
        attemptId=attempt_id,
        artifactId=artifact_id,
        validatorVersion=VALIDATOR_VERSION,
        fileHash=file_hash,
        status=overall_status,
        practicalScore=practical_score,
        workbookStructure=structure,
        checkResults=check_results,
        factIds=fact_ids,
        formulaFacts=formula_facts,
        rowCounts={"salesDataRows": total_rows, "uniqueOrders": unique_count},
        duplicateCounts={"duplicateOrderIds": dup_count},
        expectedVsActualTotals=ExpectedVsActualTotals(
            expectedTotalRevenue=expected.get("totalRevenue"),
            actualTotalRevenue=actual_total_rev,
            expectedAverageOrder=expected.get("averageOrderValue"),
            actualAverageOrder=actual_avg_order,
            expectedUniqueOrders=expected.get("uniqueOrderCount"),
            actualUniqueOrders=unique_count,
        ),
        qualitativeObservations=qualitative_obs,
        warnings=warnings,
        errors=errors,
    )
