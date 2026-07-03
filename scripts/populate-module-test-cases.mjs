/**
 * Populates module sheet with test cases from scripts/data/*.mjs
 * Usage: node scripts/populate-module-test-cases.mjs DASHBOARD
 *        node scripts/populate-module-test-cases.mjs ASSET-ONBOARDING
 */
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { dashboardOverviewCases } from "./data/dashboard-overview-test-cases.mjs";
import { assetOnboardingCases } from "./data/asset-onboarding-test-cases.mjs";

/** @type {Record<string, { cases: object[]; title: string; indexModule: string }>} */
const SHEET_REGISTRY = {
  DASHBOARD: {
    cases: dashboardOverviewCases,
    title: "Dashboard — Dashboard Overview (Manual Test Cases)",
    indexModule: "Dashboard",
  },
  "ASSET-ONBOARDING": {
    cases: assetOnboardingCases,
    title: "Asset Onboarding — Add Meter → Add Consumer → Add DTR (Manual Test Cases)",
    indexModule: "Asset Onboarding",
  },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKBOOK = path.join(__dirname, "..", "src", "Manual Testing", "INDOORE_TESTING.xlsx");
const TEMPLATE = path.join(__dirname, "..", "templates", "INDOORE_MANUAL_TESTING_TEMPLATE.xlsx");

const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E78" },
};
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const SUBHEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9E1F2" },
};

const HEADERS = [
  "Test Case ID",
  "Module",
  "Feature",
  "Requirement ID",
  "Test Scenario",
  "Test Case Description",
  "Preconditions",
  "Test Data",
  "Test Steps",
  "Expected Result",
  "Priority",
  "Severity",
  "Type",
  "Status",
  "Actual Result",
  "Defect ID",
  "Tester",
  "Execution Date",
  "Comments",
];

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  row.height = 28;
}

function caseToRow(c) {
  return [
    c.id,
    c.module,
    c.feature,
    c.requirementId,
    c.scenario,
    c.description,
    c.preconditions,
    c.testData,
    c.steps,
    c.expected,
    c.priority,
    c.severity,
    c.type,
    c.status,
    "",
    "",
    "",
    "",
    "",
  ];
}

async function populateSheet(workbook, sheetName, cases, title) {
  const existing = workbook.getWorksheet(sheetName);
  if (existing) {
    workbook.removeWorksheet(existing.id);
  }
  const ws = workbook.addWorksheet(sheetName);

  ws.mergeCells("A1:S1");
  ws.getCell("A1").value = title;
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1F4E78" } };
  ws.getRow(1).height = 24;

  ws.mergeCells("A2:S2");
  const sub = ws.getCell("A2");
  sub.value = `Documented cases: ${cases.length} | Status default: Not Executed | Execution order: follow Test Case ID sequence`;
  sub.fill = SUBHEADER_FILL;
  sub.alignment = { wrapText: true, vertical: "middle" };
  ws.getRow(2).height = 28;

  const headerRow = ws.getRow(3);
  headerRow.values = HEADERS;
  styleHeaderRow(headerRow);
  ws.autoFilter = { from: "A3", to: "S3" };
  ws.views = [{ state: "frozen", ySplit: 3 }];

  cases.forEach((c) => ws.addRow(caseToRow(c)));

  const widths = [18, 18, 32, 16, 28, 36, 28, 22, 44, 40, 10, 10, 14, 14, 20, 12, 14, 14, 24];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  return cases.length;
}

async function updateIndex(workbook, sheetName, count, indexModule, featuresSummary) {
  const index = workbook.getWorksheet("INDEX");
  if (!index) return;

  let found = false;
  for (let r = 3; r <= index.rowCount; r++) {
    const cell = index.getRow(r).getCell(1);
    if (cell.value === sheetName) {
      index.getRow(r).getCell(3).value = count;
      index.getRow(r).getCell(5).value = 0;
      index.getRow(r).getCell(6).value = "0%";
      if (featuresSummary) {
        index.getRow(r).getCell(4).value = featuresSummary;
      }
      found = true;
      break;
    }
  }

  if (!found) {
    const row = index.addRow([
      sheetName,
      indexModule,
      count,
      featuresSummary ?? "",
      0,
      "0%",
    ]);
    row.getCell(1).font = { bold: true, color: { argb: "FF0563C1" } };
  }
}

async function main() {
  const sheetArg = process.argv[2] || "DASHBOARD";
  const config = SHEET_REGISTRY[sheetArg];

  if (!config) {
    console.error(
      `Unknown sheet: ${sheetArg}. Available: ${Object.keys(SHEET_REGISTRY).join(", ")}`,
    );
    process.exit(1);
  }

  const { cases, title, indexModule } = config;
  const featuresSummary = [
    ...new Set(cases.map((c) => String(c.feature).split(" > ")[0])),
  ].join(", ");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(WORKBOOK);

  const count = await populateSheet(workbook, sheetArg, cases, title);
  await updateIndex(workbook, sheetArg, count, indexModule, featuresSummary);

  await workbook.xlsx.writeFile(WORKBOOK);

  try {
    await workbook.xlsx.writeFile(TEMPLATE);
  } catch (err) {
    console.warn(`Could not update template (file may be open): ${TEMPLATE}`);
  }

  console.log(`Updated ${sheetArg} sheet with ${count} test cases.`);
  console.log(`Files:\n  ${WORKBOOK}`);
  if (!process.env.SKIP_TEMPLATE) {
    console.log(`  ${TEMPLATE}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
