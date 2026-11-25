from pathlib import Path
import openpyxl
import pytest

from prooffolio_validator.validator import validate_workbook


def _build_clean_workbook(path: Path, sort_rows: bool = True) -> dict:
    wb = openpyxl.Workbook()
    ws_sales = wb.active
    ws_sales.title = "Sales_Data"
    ws_sales.append(["Order ID", "Date", "Customer Name", "Category", "Amount"])

    rows = [
        ("ORD-1001", "2026-10-05", "Aarav K.", "Electronics", 500),
        ("ORD-1002", "2026-10-08", "Diya S.", "Grocery", 300),
        ("ORD-1003", "2026-10-12", "Kiran R.", "General", 400),
    ]
    if not sort_rows:
        rows = [rows[2], rows[0], rows[1]]
    for r in rows:
        ws_sales.append(list(r))

    ws_sum = wb.create_sheet("Summary")
    ws_sum.append(["Metric", "Value"])
    ws_sum.append(["Total Revenue", "=SUM(Sales_Data!E2:E4)"])
    ws_sum.append(["Average Order Value", "=AVERAGE(Sales_Data!E2:E4)"])
    ws_sum.append(["Electronics Count", '=COUNTIF(Sales_Data!D2:D4,"Electronics")'])

    # Note: openpyxl does not evaluate formulas, so for cached-value tests we can also test
    # formula-only vs cached-value workbooks. Let's return expected outputs.
    wb.save(path)
    return {"totalRevenue": 1200.0, "averageOrderValue": 400.0, "uniqueOrderCount": 3}


def _build_clean_workbook_with_cached_values(path: Path, total_val: float = 1200.0) -> dict:
    """Builds a valid workbook with both formulas and cached <v> tags via raw XML zip."""
    import zipfile

    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        "</Types>"
    )
    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        "</Relationships>"
    )
    wb_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        "<sheets>"
        '<sheet name="Sales_Data" sheetId="1" r:id="rId1"/>'
        '<sheet name="Summary" sheetId="2" r:id="rId2"/>'
        "</sheets></workbook>"
    )
    wb_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'
        "</Relationships>"
    )
    sheet1 = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
        '<row r="1"><c r="A1" t="inlineStr"><is><t>Order ID</t></is></c><c r="B1" t="inlineStr"><is><t>Date</t></is></c><c r="C1" t="inlineStr"><is><t>Customer Name</t></is></c><c r="D1" t="inlineStr"><is><t>Category</t></is></c><c r="E1" t="inlineStr"><is><t>Amount</t></is></c></row>'
        '<row r="2"><c r="A2" t="inlineStr"><is><t>ORD-1001</t></is></c><c r="B2" t="inlineStr"><is><t>2026-10-05</t></is></c><c r="C2" t="inlineStr"><is><t>Aarav K.</t></is></c><c r="D2" t="inlineStr"><is><t>Electronics</t></is></c><c r="E2"><v>500</v></c></row>'
        '<row r="3"><c r="A3" t="inlineStr"><is><t>ORD-1002</t></is></c><c r="B3" t="inlineStr"><is><t>2026-10-08</t></is></c><c r="C3" t="inlineStr"><is><t>Diya S.</t></is></c><c r="D3" t="inlineStr"><is><t>Grocery</t></is></c><c r="E3"><v>300</v></c></row>'
        '<row r="4"><c r="A4" t="inlineStr"><is><t>ORD-1003</t></is></c><c r="B4" t="inlineStr"><is><t>2026-10-12</t></is></c><c r="C4" t="inlineStr"><is><t>Kiran R.</t></is></c><c r="D4" t="inlineStr"><is><t>General</t></is></c><c r="E4"><v>400</v></c></row>'
        "</sheetData></worksheet>"
    )
    sheet2 = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
        '<row r="1"><c r="A1" t="inlineStr"><is><t>Metric</t></is></c><c r="B1" t="inlineStr"><is><t>Value</t></is></c></row>'
        f'<row r="2"><c r="A2" t="inlineStr"><is><t>Total Revenue</t></is></c><c r="B2"><f>SUM(Sales_Data!E2:E4)</f><v>{total_val}</v></c></row>'
        '<row r="3"><c r="A3" t="inlineStr"><is><t>Average Order Value</t></is></c><c r="B3"><f>AVERAGE(Sales_Data!E2:E4)</f><v>400</v></c></row>'
        '<row r="4"><c r="A4" t="inlineStr"><is><t>Electronics Count</t></is></c><c r="B4"><f>COUNTIF(Sales_Data!D2:D4,"Electronics")</f><v>1</v></c></row>'
        "</sheetData></worksheet>"
    )

    with zipfile.ZipFile(path, "w") as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("xl/workbook.xml", wb_xml)
        zf.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        zf.writestr("xl/worksheets/sheet1.xml", sheet1)
        zf.writestr("xl/worksheets/sheet2.xml", sheet2)

    return {"totalRevenue": 1200.0, "averageOrderValue": 400.0, "uniqueOrderCount": 3}


def test_correct_workbook_passes_all_checks(tmp_path: Path) -> None:
    xlsx = tmp_path / "clean.xlsx"
    expected = _build_clean_workbook_with_cached_values(xlsx, total_val=1200.0)

    sheet = validate_workbook(xlsx, "att_1", "art_1", expected)
    assert sheet.status == "ok"
    assert sheet.practicalScore == 100.0
    assert all(c.status == "pass" for c in sheet.checkResults)
    assert len(sheet.fileHash) == 64


def test_formula_result_mismatch_fails_with_hint(tmp_path: Path) -> None:
    xlsx = tmp_path / "mismatch.xlsx"
    expected = _build_clean_workbook_with_cached_values(xlsx, total_val=9999.0)

    sheet = validate_workbook(xlsx, "att_1", "art_1", expected)
    sum_chk = next(c for c in sheet.checkResults if c.checkId == "chk_summary_formulas")
    assert sum_chk.status == "fail"
    assert sum_chk.actionableHint is not None


def test_duplicate_row_fails_duplicate_check(tmp_path: Path) -> None:
    xlsx = tmp_path / "dup.xlsx"
    expected = _build_clean_workbook(xlsx)
    wb = openpyxl.load_workbook(xlsx)
    wb["Sales_Data"].append(["ORD-1001", "2026-10-05", "Aarav K.", "Electronics", 500])
    wb.save(xlsx)

    sheet = validate_workbook(xlsx, "att_1", "art_1", expected)
    dup_chk = next(c for c in sheet.checkResults if c.checkId == "chk_duplicates_removed")
    assert dup_chk.status == "fail"
    assert sheet.duplicateCounts["duplicateOrderIds"] == 1


def test_bad_date_and_multiple_errors(tmp_path: Path) -> None:
    xlsx = tmp_path / "multi_err.xlsx"
    expected = _build_clean_workbook(xlsx)
    wb = openpyxl.load_workbook(xlsx)
    wb["Sales_Data"]["B2"] = "05/10/2026"  # non-ISO date
    wb["Sales_Data"]["C2"] = "  aarav k.  "  # untrimmed & lowercase
    wb["Sales_Data"]["D2"] = ""  # blank category
    wb["Sales_Data"]["E2"] = "Rs. 500"  # text currency
    wb.save(xlsx)

    sheet = validate_workbook(xlsx, "att_1", "art_1", expected)
    statuses = {c.checkId: c.status for c in sheet.checkResults}
    assert statuses["chk_date_normalization"] == "fail"
    assert statuses["chk_whitespace_casing"] == "fail"
    assert statuses["chk_missing_currency"] == "fail"


def test_missing_sheet_fails_structure(tmp_path: Path) -> None:
    xlsx = tmp_path / "missing_sheet.xlsx"
    wb = openpyxl.Workbook()
    wb.active.title = "Sales_Data"
    wb.active.append(["Order ID", "Date", "Customer Name", "Category", "Amount"])
    wb.save(xlsx)

    sheet = validate_workbook(xlsx, "att_1", "art_1")
    assert sheet.practicalScore == 0.0
    assert sheet.checkResults[0].checkId == "chk_structure_sheets"
    assert sheet.checkResults[0].status == "fail"


def test_malformed_workbook_preserves_file_and_returns_parse_error(tmp_path: Path) -> None:
    bad = tmp_path / "corrupt.xlsx"
    bad.write_bytes(b"corrupt-non-zip-data")

    sheet = validate_workbook(bad, "att_1", "art_1")
    assert sheet.status == "parse_error"
    assert bad.exists()
    assert len(sheet.errors) == 1


def test_unsupported_formula_marked_unknown_review_not_pass(tmp_path: Path) -> None:
    xlsx = tmp_path / "unsupported_formula.xlsx"
    expected = _build_clean_workbook(xlsx)
    wb = openpyxl.load_workbook(xlsx)
    wb["Summary"]["B2"] = "=MYCUSTOMFUNC(Sales_Data!E2:E4)"
    wb.save(xlsx)

    sheet = validate_workbook(xlsx, "att_1", "art_1", expected)
    assert sheet.status == "review_required"
    sum_chk = next(c for c in sheet.checkResults if c.checkId == "chk_summary_formulas")
    assert sum_chk.status == "unknown"


def test_qualitative_sort_order_does_not_fail_objective_checks(tmp_path: Path) -> None:
    xlsx = tmp_path / "unsorted.xlsx"
    expected = _build_clean_workbook(xlsx, sort_rows=False)

    sheet = validate_workbook(xlsx, "att_1", "art_1", expected)
    assert any(obs.factId == "fact_sort_order" for obs in sheet.qualitativeObservations)
