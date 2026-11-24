import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface TranscriptFile {
  id: string;
  name: string;
  group: "bluffer" | "genuine";
  description: string;
  turns: { speaker: "agent" | "candidate"; text: string }[];
}

const transcripts: TranscriptFile[] = [
  // -------------------------------------------------------------
  // 10 BLUFFER TRANSCRIPTS
  // Confident jargon, buzzwords, no real explanations, no concrete examples
  // -------------------------------------------------------------
  {
    id: "bluffer-01",
    name: "Enterprise Paradigm Architect",
    group: "bluffer",
    description: "Speaks entirely in corporate enterprise buzzwords without syntax or concrete steps",
    turns: [
      { speaker: "agent", text: "Can you explain how Excel formulas and functions work?" },
      { speaker: "candidate", text: "Excel operates as a holistic computational paradigm. We leverage dynamic multi-tiered processing architectures to optimize end-to-end analytical throughput and deliver seamless stakeholder visibility." },
      { speaker: "agent", text: "What happens when you copy a reference to another cell?" },
      { speaker: "candidate", text: "The relational topology synchronizes across the grid framework. It dynamically leverages baseline vectors to align enterprise data points without frictional latency." },
      { speaker: "agent", text: "How would you format numbers or summarize data in a table?" },
      { speaker: "candidate", text: "We deploy standard best-in-class presentation protocols and comprehensive visual modalities to maximize operational impact across all business units." }
    ]
  },
  {
    id: "bluffer-02",
    name: "Circular Tautologist",
    group: "bluffer",
    description: "Repeats the question concepts circularly with supreme confidence",
    turns: [
      { speaker: "agent", text: "Can you explain the difference between a workbook and a worksheet?" },
      { speaker: "candidate", text: "A workbook is a book where you do work, and a worksheet is a sheet where work happens. They are intrinsically related because sheets live inside books to enable working." },
      { speaker: "agent", text: "How do formulas calculate results in Excel?" },
      { speaker: "candidate", text: "Calculations occur when formulas execute computational calculations. The system processes the calculations mathematically to formulate the final calculated result." },
      { speaker: "agent", text: "What is the difference between sorting and filtering?" },
      { speaker: "candidate", text: "Sorting is fundamentally about sorting the elements, whereas filtering is distinctly about applying filters. Each one carries out its dedicated functionality." }
    ]
  },
  {
    id: "bluffer-03",
    name: "AI & Big Data Name-Dropper",
    group: "bluffer",
    description: "Name-drops neural networks, cloud computing, and machine learning instead of basic Excel",
    turns: [
      { speaker: "agent", text: "How do you add up numbers in Excel?" },
      { speaker: "candidate", text: "In enterprise workflows, we pipe raw numerical telemetry into deep learning microservices that ingest high-velocity data lakes for predictive aggregation." },
      { speaker: "agent", text: "Can you explain what relative and absolute references are?" },
      { speaker: "candidate", text: "Those are legacy algorithmic pointers in memory registers. In modern distributed cloud infrastructures, quantum addressing paradigms supersede localized index mapping." },
      { speaker: "agent", text: "How would you present this data in a chart?" },
      { speaker: "candidate", text: "We render immersive 3D generative dashboards utilizing neural heuristics that synthesize predictive telemetry into real-time executive cognitive interfaces." }
    ]
  },
  {
    id: "bluffer-04",
    name: "Consulting Framework Pitcher",
    group: "bluffer",
    description: "Presents McKinsey-style advisory slide concepts with zero spreadsheet substance",
    turns: [
      { speaker: "agent", text: "How do you write an IF condition in Excel?" },
      { speaker: "candidate", text: "Decision matrices require robust strategic decision tree governance. We structure binary choice architecture around value-chain optimization and core stakeholder buy-in." },
      { speaker: "agent", text: "What happens if a cell reference has a dollar sign like $A$1?" },
      { speaker: "candidate", text: "The dollar notation is part of our strategic monetization framework, ensuring fiscal guardrails and currency compliance across all financial spreadsheets." },
      { speaker: "agent", text: "How do you sort customer data by order volume?" },
      { speaker: "candidate", text: "We apply a top-down Pareto prioritization framework to rank order pipelines based on quarterly run-rate synergies." }
    ]
  },
  {
    id: "bluffer-05",
    name: "The Vague Hand-Waver",
    group: "bluffer",
    description: "Claims everything is trivial and obvious while refusing to provide any specifics",
    turns: [
      { speaker: "agent", text: "Could you walk me through creating a basic formula?" },
      { speaker: "candidate", text: "It is quite straightforward. Anyone with basic computer intuition simply opens the spreadsheet, types the necessary commands into the box, and presses enter to get the exact answer." },
      { speaker: "agent", text: "What specific commands or symbols do you type?" },
      { speaker: "candidate", text: "You just use the standard mathematical notations that everyone learns in school. Excel is very smart and understands the context immediately." },
      { speaker: "agent", text: "How do you filter rows in a dataset?" },
      { speaker: "candidate", text: "You just click on the intuitive button at the top and select the obvious choice. The software takes care of all the background filtering automatically." }
    ]
  },
  {
    id: "bluffer-06",
    name: "Misconception Confident Bluffer",
    group: "bluffer",
    description: "Extremely confident candidate who confidently states common misconceptions",
    turns: [
      { speaker: "agent", text: "How should an Excel formula begin, and how do references work?" },
      { speaker: "candidate", text: "Every advanced formula should start with # in the formula bar. When dealing with addresses, $A$1 is a relative reference because dollar signs indicate currency amounts in financial sheets." },
      { speaker: "agent", text: "What happens when you copy that reference down a column?" },
      { speaker: "candidate", text: "An absolute reference changes every time you copy it because it dynamically updates across rows to keep up with the new entries." },
      { speaker: "agent", text: "How does SUM handle different types of data?" },
      { speaker: "candidate", text: "The SUM is only for text concatenation, whereas plus operators handle all raw mathematics." }
    ]
  },
  {
    id: "bluffer-07",
    name: "Menu Clicker & UI Guesser",
    group: "bluffer",
    description: "Describes clicking around the screen and ribbon tabs without knowing how formulas work",
    turns: [
      { speaker: "agent", text: "Can you explain how to calculate the average of five numbers?" },
      { speaker: "candidate", text: "I navigate to the top ribbon, look through the menus until I see the little math symbol, click the dropdown menu, and choose the third option in the pop-up modal." },
      { speaker: "agent", text: "What does the resulting formula look like in the cell?" },
      { speaker: "candidate", text: "It puts some letters and brackets inside the cell bar. You do not really need to inspect what is inside because the software calculates it automatically." },
      { speaker: "agent", text: "How do you select data for a chart?" },
      { speaker: "candidate", text: "You drag your mouse randomly over the screen until a pretty graphic appears, then you right click to change the color scheme." }
    ]
  },
  {
    id: "bluffer-08",
    name: "Echo Chamber Parakeet",
    group: "bluffer",
    description: "Directly parrots the agent question words in reverse order with confident fluff",
    turns: [
      { speaker: "agent", text: "Tell me how cells, ranges, and references behave in Excel." },
      { speaker: "candidate", text: "In Excel, cells, ranges, and references behave by interacting as cells, ranges, and references across the whole spreadsheet environment." },
      { speaker: "agent", text: "What happens when you copy a formula across rows?" },
      { speaker: "candidate", text: "When you copy a formula across rows, the formula is copied across rows, ensuring that the rows have the formula copied to them." },
      { speaker: "agent", text: "Can you give me an example with specific cell coordinates?" },
      { speaker: "candidate", text: "Specific coordinates operate as coordinates that are specific to the given location in the coordinate system." }
    ]
  },
  {
    id: "bluffer-09",
    name: "Executive Visionary",
    group: "bluffer",
    description: "Treats the viva like a board presentation on digital transformation",
    turns: [
      { speaker: "agent", text: "How do you ensure data reliability in an Excel budget?" },
      { speaker: "candidate", text: "Data reliability requires holistic leadership alignment, zero-trust organizational culture, and proactive stakeholder governance across all operational deliverables." },
      { speaker: "agent", text: "Do you use formulas like SUM or IF to check figures?" },
      { speaker: "candidate", text: "We empower frontline teams with strategic accountability metrics rather than micromanaging low-level procedural calculations in individual software applications." },
      { speaker: "agent", text: "How do you present the budget variances to management?" },
      { speaker: "candidate", text: "Through high-impact strategic storytelling and visionary deck presentations that focus on macro outcomes rather than cell-level details." }
    ]
  },
  {
    id: "bluffer-10",
    name: "Jargon Overloader",
    group: "bluffer",
    description: "Piles on pseudo-technical terminology without any spreadsheet coherence",
    turns: [
      { speaker: "agent", text: "Can you explain how Excel manages tables and sorting?" },
      { speaker: "candidate", text: "Tabular schemas utilize B-tree indexation structures with relational normalization protocols to serialize column matrices during algorithmic rearrangement cycles." },
      { speaker: "agent", text: "How do you sort a table without mixing up rows?" },
      { speaker: "candidate", text: "We enforce atomic transactional integrity across the tuple array to prevent asynchronous serialization anomalies across memory buffers." },
      { speaker: "agent", text: "What formula would you use to get the column total?" },
      { speaker: "candidate", text: "An asynchronous map-reduce aggregation kernel executed against the columnar storage pipeline." }
    ]
  },

  // -------------------------------------------------------------
  // 10 GENUINE CANDIDATE TRANSCRIPTS
  // Clear explanations, concrete examples, cell syntax, some imperfect
  // -------------------------------------------------------------
  {
    id: "genuine-01",
    name: "Strong Technical Candidate",
    group: "genuine",
    description: "Thorough, structured explanation with exact syntax and concrete examples",
    turns: [
      { speaker: "agent", text: "Let us start with worksheets and workbooks. Can you explain the difference?" },
      { speaker: "candidate", text: "A workbook is the entire Excel file, like sales_2026.xlsx. Inside it you have individual sheet tabs like January and February. You can right-click a sheet tab to rename it or drag it to reorder." },
      { speaker: "agent", text: "How do cells and references work when copying formulas?" },
      { speaker: "candidate", text: "A cell is addressed by column letter and row number, like B3. When I write =A2 and copy it down one row, it becomes =A3 because it is a relative reference. But $A$1 is an absolute reference where dollar signs lock both column and row so it does not change when copied." },
      { speaker: "agent", text: "How do formulas and functions work?" },
      { speaker: "candidate", text: "Every formula starts with an equals sign. =SUM(A1:A10) adds the numbers in that range. For logic, =IF(B2>=50,\"Pass\",\"Fail\") tests a condition. I also use AVERAGE for means and COUNT for numbers." },
      { speaker: "agent", text: "Tell me about formatting, tables, and charts." },
      { speaker: "candidate", text: "Number formats change appearance: 0.1 becomes 10% under percent format, and currency adds ₹ or $. In tables, header rows let you sort all rows together or filter to hide non-matching rows. For charts, I select data like A1:B5 and add a clear chart title and label axes." }
    ]
  },
  {
    id: "genuine-02",
    name: "Practical Financial Analyst",
    group: "genuine",
    description: "Focused on revenue calculations, tax references, and financial reporting",
    turns: [
      { speaker: "agent", text: "How do you calculate tax and totals in an invoice sheet?" },
      { speaker: "candidate", text: "I put the tax rate 18% in cell $B$1. In column D I write =C2*$B$1 to compute tax for item 1. When I copy this formula down to row 20, the relative reference C2 becomes C3, but $B$1 stays fixed because it is an absolute reference." },
      { speaker: "agent", text: "How do you calculate the grand total and average invoice size?" },
      { speaker: "candidate", text: "At the bottom, say D21, I write =SUM(D2:D20) to add all the amounts. Then in D22 I use =AVERAGE(D2:D20) to find the average invoice amount. Both formulas start with equals." },
      { speaker: "agent", text: "How do you format these amounts and present monthly trends?" },
      { speaker: "candidate", text: "I select column D and apply currency format so it shows the currency symbol and two decimals. For trends over months, I select the month names and revenue totals to insert a line chart with a descriptive title." }
    ]
  },
  {
    id: "genuine-03",
    name: "Imperfect But Clear Beginner",
    group: "genuine",
    description: "Explains basic formulas and cell references well with examples, slightly informal on charts",
    turns: [
      { speaker: "agent", text: "Can you explain how to add numbers in Excel?" },
      { speaker: "candidate", text: "You always begin with the equals sign in the cell. To add cells from A1 to A5, you type =SUM(A1:A5) and hit enter. It adds up all the values in that range." },
      { speaker: "agent", text: "What happens if you drag that formula to the next column?" },
      { speaker: "candidate", text: "If you drag =SUM(A1:A5) from column A to column B, it becomes =SUM(B1:B5) because the column letters shift. But if you wrote =$A$1, the dollar signs keep it locked as an absolute reference so it will not copy differently." },
      { speaker: "agent", text: "How would you show only high sales in your table?" },
      { speaker: "candidate", text: "You turn on filter on the table header row. Then you click the little arrow on Sales and uncheck small numbers so only high ones show. It does not delete anything, just hides them." },
      { speaker: "agent", text: "How do you make a chart?" },
      { speaker: "candidate", text: "I select data with labels, click insert column chart, and type a title at the top so people know what it is." }
    ]
  },
  {
    id: "genuine-04",
    name: "Retail Inventory Manager",
    group: "genuine",
    description: "Focuses on stock levels, product tables, sorting, and conditional restock alerts",
    turns: [
      { speaker: "agent", text: "How do you manage inventory records in Excel?" },
      { speaker: "candidate", text: "I keep a table with headers like Item, Quantity, and ReorderLevel. To find low stock items, I can sort the table by Quantity ascending, which moves entire rows together so product names stay matched." },
      { speaker: "agent", text: "How do you flag items that need reordering?" },
      { speaker: "candidate", text: "In column D I use an IF formula: =IF(B2<=C2,\"Reorder\",\"OK\"). If the current stock B2 is less than reorder level C2, it says Reorder. I copy this down all rows." },
      { speaker: "agent", text: "How do you format long product descriptions and prices?" },
      { speaker: "candidate", text: "For long names I turn on wrap text and adjust alignment so the text fits nicely without spilling over. For prices, I apply currency format." }
    ]
  },
  {
    id: "genuine-05",
    name: "School Gradebook Teacher",
    group: "genuine",
    description: "Tracks student marks, averages, pass/fail status, and grade distribution charts",
    turns: [
      { speaker: "agent", text: "How do you calculate student marks in your spreadsheet?" },
      { speaker: "candidate", text: "Student scores are in columns B through F. In column G, I write =SUM(B2:F2) to get total marks, and in column H I write =AVERAGE(B2:F2) to get their percentage average." },
      { speaker: "agent", text: "How do you determine if a student passed?" },
      { speaker: "candidate", text: "I use =IF(H2>=40,\"Pass\",\"Fail\"). If average H2 is at least 40, it shows Pass. When I copy this formula down to row 30, relative references automatically evaluate each student." },
      { speaker: "agent", text: "How do you show the pass rate to parents?" },
      { speaker: "candidate", text: "I select data for the Pass and Fail counts and insert a chart. I add a title like Term 1 Results and label each slice so parents see the breakdown clearly." }
    ]
  },
  {
    id: "genuine-06",
    name: "Budgeting Assistant (Imperfect Syntax)",
    group: "genuine",
    description: "Understands core principles and references, occasionally imperfect on advanced features",
    turns: [
      { speaker: "agent", text: "What is the difference between a workbook and sheets?" },
      { speaker: "candidate", text: "The workbook is the file on my computer. Inside, I have multiple worksheet tabs, one for each department like Marketing and Operations. I can click a sheet tab to jump between them." },
      { speaker: "agent", text: "How do you total each department budget?" },
      { speaker: "candidate", text: "I use =SUM(C2:C15) to sum expenses. If I want the maximum expense, I write =MAX(C2:C15), and for lowest, =MIN(C2:C15). All formulas must start with =." },
      { speaker: "agent", text: "Explain absolute references and percent formatting." },
      { speaker: "candidate", text: "If company growth rate is in cell A1, I write =B2*$A$1 so when I copy it, $A$1 stays fixed as an absolute reference. To show 0.05 as 5%, I select the cell and click percent format." }
    ]
  },
  {
    id: "genuine-07",
    name: "HR Operations Specialist",
    group: "genuine",
    description: "Explains employee lists, filtering by department, counting heads, and salary formatting",
    turns: [
      { speaker: "agent", text: "How do you organize employee data in Excel?" },
      { speaker: "candidate", text: "I convert the employee list into an Excel table with a header row containing ID, Name, Department, and Salary. That way I can filter by Department to view only Engineering without deleting other staff." },
      { speaker: "agent", text: "How do you count employees and find total salary?" },
      { speaker: "candidate", text: "To count employees with IDs, I use =COUNT(A2:A100) because COUNT handles numbers. For salary expense, I write =SUM(D2:D100). Both formulas start with =." },
      { speaker: "agent", text: "How do you format salary numbers and visualize department headcount?" },
      { speaker: "candidate", text: "I select the salary column and choose currency format. For headcounts, I select data for departments and create a column chart with title 'Headcount by Department' and axis labels." }
    ]
  },
  {
    id: "genuine-08",
    name: "Customer Support Team Lead",
    group: "genuine",
    description: "Tracks ticket volumes, resolution averages, customer satisfaction percentages",
    turns: [
      { speaker: "agent", text: "How do you measure weekly ticket resolution?" },
      { speaker: "candidate", text: "Tickets resolved per agent are in B2:B25. I calculate team average with =AVERAGE(B2:B25) and total with =SUM(B2:B25). Every calculation begins with =." },
      { speaker: "agent", text: "What if an agent has special bonus multiplier in cell $F$1?" },
      { speaker: "candidate", text: "In C2 I write =B2*$F$1. The dollar signs lock F1 as an absolute reference, so when I copy the formula down to C25, B2 becomes B3, B4, but $F$1 stays locked." },
      { speaker: "agent", text: "How do you present satisfaction scores?" },
      { speaker: "candidate", text: "Satisfaction decimal 0.92 is formatted using percent format to display as 92%. In the table header, I sort by satisfaction score descending to recognize top performers." }
    ]
  },
  {
    id: "genuine-09",
    name: "Logistics Dispatcher",
    group: "genuine",
    description: "Practical explanation of delivery times, sorting routes, and fuel allowance calculations",
    turns: [
      { speaker: "agent", text: "How do you calculate delivery allowances?" },
      { speaker: "candidate", text: "Fuel rate per kilometer is in cell $A$1. For trip distance in B2, the allowance is =B2*$A$1. Because $A$1 is absolute, copying it down to row 50 maintains the same fuel rate." },
      { speaker: "agent", text: "How do you check for overtime trips?" },
      { speaker: "candidate", text: "I use =IF(C2>8,\"Overtime\",\"Standard\"). If driving hours in C2 exceed 8, it flags Overtime. I also use =SUM(D2:D50) to get the total daily allowance." },
      { speaker: "agent", text: "How do you organize the route sheets and charts?" },
      { speaker: "candidate", text: "Each dispatch day has its own worksheet tab in the workbook. In the dispatch table, I sort by delivery priority. I select data and make a chart comparing trips by zone with a title." }
    ]
  },
  {
    id: "genuine-10",
    name: "Marketing Campaign Specialist",
    group: "genuine",
    description: "Explains ad click metrics, conversion rate percentages, ROI formulas, and comparisons",
    turns: [
      { speaker: "agent", text: "How do you evaluate digital campaign spend in Excel?" },
      { speaker: "candidate", text: "I have columns for Clicks, Conversions, and Cost. In conversion rate column, I write =B2/A2 and format it as percent format so 0.04 displays as 4%." },
      { speaker: "agent", text: "How do you sum up costs and find if a campaign was profitable?" },
      { speaker: "candidate", text: "I sum total spend with =SUM(C2:C20). To check profitability, I use =IF(D2>C2,\"Profitable\",\"Loss\"). Formulas always start with an equals sign." },
      { speaker: "agent", text: "How do you compare performance between channels?" },
      { speaker: "candidate", text: "In my campaign table, I filter to isolate Facebook or Google ads. Then I select data for spend versus revenue and build a column chart, adding a title and axis label for clarity." }
    ]
  }
];

async function main(): Promise<void> {
  const dir = resolve(dirname(fileURLToPath(import.meta.url)), "transcripts");
  await mkdir(dir, { recursive: true });

  for (const t of transcripts) {
    const filename = `${t.id}.json`;
    const target = resolve(dir, filename);
    await writeFile(target, JSON.stringify(t, null, 2), "utf8");
    console.log(`Wrote ${target}`);
  }
  console.log(`Generated ${transcripts.length} transcripts (10 bluffer, 10 genuine).`);
}

void main();
