/**
 * Builds module-wise manual testing workbook sheets.
 * Run: node scripts/build-manual-testing-workbook.mjs
 */
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(
  __dirname,
  "..",
  "src",
  "Manual Testing",
  "INDOORE_TESTING.xlsx",
);

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

/** @type {{ sheet: string; module: string; targetCases: number; features: string[] }[]} */
const MODULES = [
  {
    sheet: "AUTH",
    module: "Authentication",
    targetCases: 120,
    features: ["Login", "Logout", "2FA", "Device Selection", "Session", "Forgot Password"],
  },
  {
    sheet: "DASHBOARD",
    module: "Dashboard",
    targetCases: 180,
    features: ["DTR Summary", "Metrics", "Communication", "Consumption Widget", "Power Status"],
  },
  {
    sheet: "OVERALL-DASHBOARD",
    module: "Overall Dashboard",
    targetCases: 140,
    features: ["KPI Cards", "Summary Charts", "Drill-down", "Filters"],
  },
  {
    sheet: "CONSUMERS",
    module: "Consumers",
    targetCases: 450,
    features: [
      "Consumer List",
      "Profile",
      "Live Load Profile",
      "Real Time Power",
      "Power Quality",
      "Energy Graph",
      "Energy Flow",
      "Event Log",
      "Billing History",
      "Activation",
    ],
  },
  {
    sheet: "DTRS",
    module: "DTRs",
    targetCases: 200,
    features: ["DTR List", "Statistics", "Capacity Gauge", "Power Triangle", "Events", "Feeders"],
  },
  {
    sheet: "FEEDER",
    module: "Feeder",
    targetCases: 160,
    features: ["Profile", "Electrical Parameters", "Daily Consumption", "Alerts"],
  },
  {
    sheet: "CONSUMPTION",
    module: "Consumption",
    targetCases: 280,
    features: [
      "Daily Report",
      "Pattern Comparison",
      "Last Three Months",
      "Yearly Pattern",
      "Monthly Net Meter",
    ],
  },
  {
    sheet: "BILLING",
    module: "Billing",
    targetCases: 120,
    features: ["Billing Data", "Day-wise Billing"],
  },
  {
    sheet: "COMMERCIAL-ANALYSIS",
    module: "Commercial Analysis",
    targetCases: 200,
    features: [
      "Summary",
      "Consumption Pattern",
      "Consumption Compare",
      "Load Factor",
      "MD Analysis",
      "Power Factor",
    ],
  },
  {
    sheet: "TECHNICAL-ANALYSIS",
    module: "Technical Analysis",
    targetCases: 80,
    features: ["Technical Summary", "Technical Analysis"],
  },
  {
    sheet: "MIS-DASHBOARDS",
    module: "MIS Dashboards",
    targetCases: 400,
    features: [
      "Communication",
      "Communication Stats",
      "Event Data Voltage",
      "Event Data Current",
      "Event Data Power",
      "Event Data Transaction",
      "Non Rollover",
      "Event Classification",
      "Priority Overview",
    ],
  },
  {
    sheet: "MASTER-DATA",
    module: "Master Data",
    targetCases: 120,
    features: ["Consumer Master", "DTR Master", "Feeder Master", "Substation Master"],
  },
  {
    sheet: "ASSET-MANAGEMENT",
    module: "Asset Management",
    targetCases: 100,
    features: ["Organization Hierarchy", "Network Hierarchy", "DTR ID Lookup"],
  },
  {
    sheet: "UTILS-LOOKUP",
    module: "Search & Lookup",
    targetCases: 180,
    features: [
      "Consumer Search",
      "DTR Search",
      "Network Search",
      "Organization Search",
      "Dropdown Lookups",
    ],
  },
  {
    sheet: "REPORTS",
    module: "Reports",
    targetCases: 100,
    features: ["Event Report", "Event Detail", "DTR Billing Report"],
  },
  {
    sheet: "NOTIFICATIONS",
    module: "Notifications",
    targetCases: 60,
    features: ["Web Notifications", "Mobile Notifications"],
  },
  {
    sheet: "AUDIT-LOGS",
    module: "Audit Logs",
    targetCases: 60,
    features: ["Audit Log List", "Audit Export"],
  },
  {
    sheet: "USERS-ADMIN",
    module: "Users Admin",
    targetCases: 100,
    features: ["User Management", "User Security", "User Devices"],
  },
  {
    sheet: "ROLE-PERMISSIONS",
    module: "Role Permissions",
    targetCases: 50,
    features: ["Role Permission Matrix"],
  },
  {
    sheet: "MODULE-PERMISSIONS",
    module: "Module Permissions",
    targetCases: 50,
    features: ["Module Access Matrix"],
  },
  {
    sheet: "HES-COMMANDS",
    module: "HES Commands",
    targetCases: 120,
    features: [
      "Meter Commands",
      "Command History",
      "Search Meters",
      "Meter Samples",
      "Meter Alarms",
      "Meter Location",
    ],
  },
  {
    sheet: "CROSS-MODULE-E2E",
    module: "Cross Module E2E",
    targetCases: 150,
    features: ["Consumer Journey", "DTR Journey", "Consumption Journey", "Admin Journey"],
  },
  {
    sheet: "NON-FUNCTIONAL",
    module: "Non Functional",
    targetCases: 80,
    features: ["Performance", "UI Layout", "Browser", "Error Handling"],
  },
];

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

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  row.height = 28;
}

function setColumnWidths(sheet) {
  const widths = [18, 22, 24, 16, 28, 36, 24, 20, 40, 36, 10, 10, 14, 12, 24, 12, 14, 14, 24];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
}

function addModuleSheet(workbook, { sheet, module, targetCases, features }) {
  const ws = workbook.addWorksheet(sheet, {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  ws.mergeCells("A1:S1");
  const title = ws.getCell("A1");
  title.value = `${module} — Manual Test Cases (Target: ${targetCases})`;
  title.font = { bold: true, size: 14, color: { argb: "FF1F4E78" } };
  title.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(1).height = 24;

  ws.mergeCells("A2:S2");
  const sub = ws.getCell("A2");
  sub.value = `Features: ${features.join(" | ")} | Status default: Not Executed`;
  sub.fill = SUBHEADER_FILL;
  sub.alignment = { wrapText: true, vertical: "middle" };
  ws.getRow(2).height = 30;

  const headerRow = ws.getRow(3);
  headerRow.values = HEADERS;
  styleHeaderRow(headerRow);

  ws.autoFilter = { from: "A3", to: "S3" };

  for (let i = 1; i <= targetCases; i++) {
    const id = `IND-${sheet.replace(/-/g, "").slice(0, 6).toUpperCase()}-${String(i).padStart(4, "0")}`;
    ws.addRow([
      id,
      module,
      "",
      "",
      "",
      "",
      "User logged in as Super Admin; Live environment",
      "",
      "",
      "",
      "",
      "",
      "Functional",
      "Not Executed",
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  setColumnWidths(ws);
  return ws;
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Indoore QA";
  workbook.created = new Date();

  const totalTarget = MODULES.reduce((s, m) => s + m.targetCases, 0);

  const index = workbook.addWorksheet("INDEX", { views: [{ state: "frozen", ySplit: 3 }] });
  index.mergeCells("A1:F1");
  index.getCell("A1").value = "INDOORE MDMS — Manual Testing Index (Module-wise sheets)";
  index.getCell("A1").font = { bold: true, size: 14 };

  index.getRow(2).values = [
    "Sheet Name",
    "Module",
    "Target Cases",
    "Features (summary)",
    "Executed",
    "Pass %",
  ];
  styleHeaderRow(index.getRow(2));

  MODULES.forEach((m, i) => {
    const row = index.getRow(i + 3);
    row.values = [m.sheet, m.module, m.targetCases, m.features.join(", "), 0, "0%"];
    row.getCell(1).font = { bold: true, color: { argb: "FF0563C1" } };
  });
  index.getRow(MODULES.length + 4).values = ["TOTAL", "", totalTarget, "", "", ""];
  index.getRow(MODULES.length + 4).font = { bold: true };
  [18, 22, 14, 50, 12, 10].forEach((w, i) => {
    index.getColumn(i + 1).width = w;
  });

  const summary = workbook.addWorksheet("PROJECT-SUMMARY");
  const summaryRows = [
    ["Project Information", "Value"],
    ["Project Name", "Indoore MDMS"],
    ["UI URL", "https://indore.bestinfra.app"],
    ["Environment", "Live"],
    ["Workbook Structure", "One sheet per module"],
    ["Total Target Test Cases", totalTarget],
    ["Tester Name", ""],
    ["Execution Start Date", ""],
    ["Execution End Date", ""],
    ["", ""],
    ["Test Execution Summary", "Count"],
    ["Total Test Cases", totalTarget],
    ["Executed", 0],
    ["Passed", 0],
    ["Failed", 0],
    ["Blocked", 0],
    ["Not Executed", totalTarget],
    ["Pass Percentage", "0%"],
    ["", ""],
    ["Defect Summary", "Open", "Closed", "Total"],
    ["Critical", 0, 0, 0],
    ["High", 0, 0, 0],
    ["Medium", 0, 0, 0],
    ["Low", 0, 0, 0],
    ["", ""],
    ["Sign Off", "Name", "Signature", "Date"],
    ["QA Engineer", "", "", ""],
    ["QA Lead", "", "", ""],
    ["Project Manager", "", "", ""],
  ];
  summaryRows.forEach((r) => summary.addRow(r));
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 36;
  styleHeaderRow(summary.getRow(1));
  styleHeaderRow(summary.getRow(11));
  styleHeaderRow(summary.getRow(20));
  styleHeaderRow(summary.getRow(26));

  MODULES.forEach((m) => addModuleSheet(workbook, m));

  const defects = workbook.addWorksheet("DEFECT-REPORT", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  defects.addRow([
    "Bug ID",
    "Title",
    "Module",
    "Sheet",
    "Test Case ID",
    "Severity",
    "Priority",
    "Status",
    "Assigned To",
    "Steps to Reproduce",
    "Expected",
    "Actual",
    "Screenshot",
    "Reported Date",
    "Closed Date",
  ]);
  styleHeaderRow(defects.getRow(1));
  [12, 36, 20, 18, 18, 10, 10, 12, 16, 40, 24, 24, 16, 14, 14].forEach((w, i) => {
    defects.getColumn(i + 1).width = w;
  });

  const rtm = workbook.addWorksheet("RTM", { views: [{ state: "frozen", ySplit: 1 }] });
  rtm.addRow([
    "Requirement ID",
    "Requirement Description",
    "Module",
    "Sheet",
    "Test Case ID",
    "Test Scenario",
    "Status",
  ]);
  styleHeaderRow(rtm.getRow(1));
  [16, 40, 22, 18, 18, 32, 12].forEach((w, i) => {
    rtm.getColumn(i + 1).width = w;
  });

  const instructions = workbook.addWorksheet("HOW-TO-USE");
  [
    ["How to use this workbook"],
    [""],
    ["1. Each module has its own sheet (CONSUMERS, DTRS, etc.)."],
    ["2. Fill Feature, Scenario, Steps, Expected for each row — IDs are pre-generated."],
    ["3. Update Status: Not Executed | Pass | Fail | Blocked"],
    ["4. Log failures in DEFECT-REPORT and link Test Case ID."],
    ["5. Map requirements in RTM sheet."],
    ["6. Update INDEX executed count and PROJECT-SUMMARY when a module is done."],
    ["7. Priority: P0 = release smoke, P1 = functional, P2 = regression/edge"],
    ["8. Test module-by-module in INDEX order for solo testing."],
  ].forEach((r) => instructions.addRow(r));
  instructions.getColumn(1).width = 90;

  await workbook.xlsx.writeFile(OUT);
  console.log(`Created: ${OUT}`);
  console.log(`Modules: ${MODULES.length}`);
  console.log(`Total skeleton rows: ${totalTarget}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
