/**
 * Builds Add DTR manual test pack workbook (Node.js port of openpyxl script).
 * Run: node scripts/build-add-dtr-test-pack.mjs
 */
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { addDtrCategories, addDtrCaseCount } from "./data/add-dtr-test-cases.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(
  __dirname,
  "..",
  "src",
  "Manual Testing",
  "Add_DTR_Test_Pack.xlsx",
);

const HEADERS = [
  "Test Case ID",
  "Test Scenario",
  "Test Steps",
  "Test Data",
  "Expected Result",
  "Actual Result",
  "Status",
  "Field",
  "Validation Rule",
  "Priority",
  "Tester",
  "Execution Date",
];

const COL_COUNT = HEADERS.length;

const NAVY = "FF1F4E78";
const LIGHT_BLUE = "FFD9E1F2";
const WHITE = "FFFFFFFF";
const STRIPE_A = "FFF2F7FB";
const STRIPE_B = "FFFFFFFF";
const CAT_FILL = "FF2E75B6";

function fillSolid(cell, argb, bold = false, color = "FF000000") {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
  cell.font = { bold, color: { argb: color }, size: bold ? 11 : 10 };
  cell.alignment = { vertical: "middle", wrapText: true };
  cell.border = {
    top: { style: "thin", color: { argb: "FFB4C6E7" } },
    left: { style: "thin", color: { argb: "FFB4C6E7" } },
    bottom: { style: "thin", color: { argb: "FFB4C6E7" } },
    right: { style: "thin", color: { argb: "FFB4C6E7" } },
  };
}

function caseToRow(c) {
  return [
    c.id,
    c.scenario,
    c.steps,
    c.testData,
    c.expected,
    "",
    "Not Executed",
    c.field,
    c.rule,
    c.priority,
    "",
    "",
  ];
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Indoore QA";
  wb.created = new Date();

  const ws = wb.addWorksheet("ADD-DTR-TEST-CASES", {
    views: [{ state: "frozen", ySplit: 7 }],
  });

  ws.mergeCells(1, 1, 1, COL_COUNT);
  const title = ws.getCell(1, 1);
  title.value = "Indoore MDMS — Add New DTR Manual Test Pack";
  title.font = { bold: true, size: 16, color: { argb: NAVY } };
  title.alignment = { vertical: "middle" };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, COL_COUNT);
  ws.getCell(2, 1).value =
    "UI: DTR Data → Add New DTR  |  URL: /dtr-data/add-new-dtr  |  Reference: reports/Bulk upload validations.txt";
  fillSolid(ws.getCell(2, 1), LIGHT_BLUE);
  ws.getRow(2).height = 22;

  ws.mergeCells(3, 1, 3, COL_COUNT);
  ws.getCell(3, 1).value =
    `Total cases: ${addDtrCaseCount}  |  Wizard: Step 1 Hierarchy → Step 2 DTR Details → Step 3 Meter Details → Step 4 Additional  |  Status default: Not Executed`;
  fillSolid(ws.getCell(3, 1), LIGHT_BLUE);
  ws.getRow(3).height = 22;

  ws.getRow(4).height = 8;
  ws.getRow(5).height = 8;

  ws.mergeCells(6, 1, 6, COL_COUNT);
  ws.getCell(6, 1).value =
    "Precondition: Login as Super Admin on https://indore.bestinfra.app — use active unmapped meter MSN for Step 3 happy path";
  fillSolid(ws.getCell(6, 1), "FFFFF2CC");
  ws.getRow(6).height = 20;

  const headerRow = ws.getRow(7);
  headerRow.values = [null, ...HEADERS];
  headerRow.height = 26;
  for (let c = 1; c <= COL_COUNT; c++) {
    fillSolid(headerRow.getCell(c), NAVY, true, WHITE);
    headerRow.getCell(c).alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  }

  const widths = [16, 36, 44, 28, 40, 24, 14, 22, 28, 12, 14, 16];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  let rowNum = 8;
  for (const { name, cases } of addDtrCategories) {
    ws.mergeCells(rowNum, 1, rowNum, COL_COUNT);
    const catCell = ws.getCell(rowNum, 1);
    catCell.value = name;
    fillSolid(catCell, CAT_FILL, true, WHITE);
    catCell.font = { bold: true, size: 11, color: { argb: WHITE } };
    ws.getRow(rowNum).height = 22;
    rowNum++;

    cases.forEach((testCase, i) => {
      const row = ws.getRow(rowNum);
      const vals = caseToRow(testCase);
      vals.forEach((v, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = v;
        fillSolid(cell, i % 2 === 0 ? STRIPE_A : STRIPE_B);
      });
      row.height = 48;
      rowNum++;
    });
  }

  ws.autoFilter = {
    from: { row: 7, column: 1 },
    to: { row: rowNum - 1, column: COL_COUNT },
  };

  await wb.xlsx.writeFile(OUT);
  console.log(`Created: ${OUT}`);
  console.log(`Sheet: ADD-DTR-TEST-CASES`);
  console.log(`Categories: ${addDtrCategories.length}`);
  console.log(`Test cases: ${addDtrCaseCount}`);
  console.log(`Last row: ${rowNum - 1}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
