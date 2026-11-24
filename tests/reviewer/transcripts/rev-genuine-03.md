# Candidate Session Transcript: rev-genuine-03

- **Session ID**: `rev-genuine-03`
- **Skill**: `excel`
- **Language**: `en`
- **Rubric Version**: `1.0.0`
- **AI Total Score**: **80 / 100**
- **Started At**: 2026-11-24T16:54:48.093Z
- **Completed At**: 2026-11-24T17:54:48.095Z

---

## AI Criterion Scores (Reference)

- **Worksheets, workbooks and navigation** (`worksheets-workbooks-navigation`, weight 0.1): **0 / 100**
  *AI Note: This topic was not clearly covered in the recorded explanation.*

- **Cells, ranges and references** (`cells-ranges-references`, weight 0.2): **100 / 100**
  *AI Note: Candidate evidence: I select data with labels, click insert column chart, and type a title at the top so people know what it is.*

- **Formulas and functions** (`formulas-functions`, weight 0.25): **100 / 100**
  *AI Note: Candidate evidence: I select data with labels, click insert column chart, and type a title at the top so people know what it is.*

- **Formatting cells and number formats** (`formatting-number-formats`, weight 0.1): **0 / 100**
  *AI Note: This topic was not clearly covered in the recorded explanation.*

- **Tables, sorting and filtering** (`tables-sorting-filtering`, weight 0.15): **100 / 100**
  *AI Note: Candidate evidence: I select data with labels, click insert column chart, and type a title at the top so people know what it is.*

- **Charts** (`charts`, weight 0.2): **100 / 100**
  *AI Note: Candidate evidence: I select data with labels, click insert column chart, and type a title at the top so people know what it is.*

---

## Instructions for Human Reviewer
1. Read the dialogue below thoroughly.
2. For each criterion, assign an independent reviewer score (0 = not covered or misconception, 50 = partial understanding, 100 = solid explanation).
3. Compute or assign the overall `reviewerTotal` (0 to 100).
4. Record your scores in `/tests/reviewer/sessions.csv` under `reviewerScore_<criterionId>` and `reviewerTotal`.

---

## Dialogue Transcript

### Turn 1: Student Agent

> "Can you explain how to add numbers in Excel?"

### Turn 2: Candidate

> "You always begin with the equals sign in the cell. To add cells from A1 to A5, you type =SUM(A1:A5) and hit enter. It adds up all the values in that range."

### Turn 3: Student Agent

> "What happens if you drag that formula to the next column?"

### Turn 4: Candidate

> "If you drag =SUM(A1:A5) from column A to column B, it becomes =SUM(B1:B5) because the column letters shift. But if you wrote =$A$1, the dollar signs keep it locked as an absolute reference so it will not copy differently."

### Turn 5: Student Agent

> "How would you show only high sales in your table?"

### Turn 6: Candidate

> "You turn on filter on the table header row. Then you click the little arrow on Sales and uncheck small numbers so only high ones show. It does not delete anything, just hides them."

### Turn 7: Student Agent

> "How do you make a chart?"

### Turn 8: Candidate

> "I select data with labels, click insert column chart, and type a title at the top so people know what it is."
