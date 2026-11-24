# Candidate Session Transcript: rev-genuine-01

- **Session ID**: `rev-genuine-01`
- **Skill**: `excel`
- **Language**: `en`
- **Rubric Version**: `1.0.0`
- **AI Total Score**: **95 / 100**
- **Started At**: 2026-11-24T16:54:48.054Z
- **Completed At**: 2026-11-24T17:54:48.059Z

---

## AI Criterion Scores (Reference)

- **Worksheets, workbooks and navigation** (`worksheets-workbooks-navigation`, weight 0.1): **50 / 100**
  *AI Note: Candidate evidence: Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matchi*

- **Cells, ranges and references** (`cells-ranges-references`, weight 0.2): **100 / 100**
  *AI Note: Candidate evidence: Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matchi*

- **Formulas and functions** (`formulas-functions`, weight 0.25): **100 / 100**
  *AI Note: Candidate evidence: Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matchi*

- **Formatting cells and number formats** (`formatting-number-formats`, weight 0.1): **100 / 100**
  *AI Note: Candidate evidence: Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matchi*

- **Tables, sorting and filtering** (`tables-sorting-filtering`, weight 0.15): **100 / 100**
  *AI Note: Candidate evidence: Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matchi*

- **Charts** (`charts`, weight 0.2): **100 / 100**
  *AI Note: Candidate evidence: Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matchi*

---

## Instructions for Human Reviewer
1. Read the dialogue below thoroughly.
2. For each criterion, assign an independent reviewer score (0 = not covered or misconception, 50 = partial understanding, 100 = solid explanation).
3. Compute or assign the overall `reviewerTotal` (0 to 100).
4. Record your scores in `/tests/reviewer/sessions.csv` under `reviewerScore_<criterionId>` and `reviewerTotal`.

---

## Dialogue Transcript

### Turn 1: Student Agent

> "Let us start with worksheets and workbooks. Can you explain the difference?"

### Turn 2: Candidate

> "A workbook is the entire Excel file, like sales_2026.xlsx. Inside it you have individual sheet tabs like January and February. You can right-click a sheet tab to rename it or drag it to reorder."

### Turn 3: Student Agent

> "How do cells and references work when copying formulas?"

### Turn 4: Candidate

> "A cell is addressed by column letter and row number, like B3. When I write =A2 and copy it down one row, it becomes =A3 because it is a relative reference. But $A$1 is an absolute reference where dollar signs lock both column and row so it does not change when copied."

### Turn 5: Student Agent

> "How do formulas and functions work?"

### Turn 6: Candidate

> "Every formula starts with an equals sign. =SUM(A1:A10) adds the numbers in that range. For logic, =IF(B2>=50,"Pass","Fail") tests a condition. I also use AVERAGE for means and COUNT for numbers."

### Turn 7: Student Agent

> "Tell me about formatting, tables, and charts."

### Turn 8: Candidate

> "Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matching rows. For charts, I select data like A1:B5 and add a clear chart title and label axes."
