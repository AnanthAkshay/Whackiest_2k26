# Prooffolio Deterministic Spreadsheet Validator

Isolated Python package (`prooffolio_validator`) that performs objective, code-based checks on submitted `.xlsx` workbooks for the **Retail Sales Cleanup & Reporting** challenge.

## Safety & Execution Boundaries
- **No macro or formula execution**: Uses `openpyxl(..., data_only=False/True, keep_vba=False)` to inspect workbook XML, formula strings, and cached values safely.
- **Process isolation**: Invoked from the Node.js backend via a bounded subprocess (`timeout=15s`, `maxBuffer=2MB`).
- **AWS Deployment Option**: Package `validator/` into a containerized AWS Lambda (or ECS/Fargate worker) triggered asynchronously when an `EvidenceArtifact` is uploaded to S3.

## Checks & Fact Mapping (`rubrics/retail_sales_cleanup.json`)
| Check ID | Critical | Measurement | Fact IDs |
|---|---|---|---|
| `chk_structure_sheets` | Yes | Verifies `Sales_Data` & `Summary` sheets and exact 5-column headers | `fact_sheets_present`, `fact_headers_match` |
| `chk_duplicates_removed` | Yes | Uses `pandas` to verify 0 duplicate `Order ID` rows and expected count | `fact_unique_order_count`, `fact_duplicates_removed` |
| `chk_whitespace_casing` | No | Checks `Customer Name` for leading/trailing spaces and lowercase | `fact_trimmed_names` |
| `chk_date_normalization` | Yes | Verifies ISO `YYYY-MM-DD` or native Excel date values | `fact_dates_standardized` |
| `chk_missing_currency` | No | Checks blank categories imputed and numeric `Amount` values | `fact_missing_categories_imputed`, `fact_numeric_amounts` |
| `chk_summary_formulas` | Yes | Checks supported formulas (`=SUM`, `=AVERAGE`, `=COUNTIF`) and results | `fact_summary_formulas`, `fact_total_revenue_match` |

## Local CLI Usage
```powershell
npm run validate:fixture
```
Or invoke Python directly:
```powershell
$env:PYTHONPATH="validator"
python -m prooffolio_validator.cli --file <path.xlsx> --attempt-id att_1 --artifact-id art_1
```
