import path from "path";
import ExcelJS from "exceljs";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import { CREATE_METER_FIELD_LIMITS } from "./create-meter.data";
import type { BulkUploadMetersScenario } from "../Mapper/bulk-upload-meters.mapper";
import { resolveMasterDataEnv as envValue } from "../utils/master-data-env.helper";
import { getStaticMeterManufacturerName } from "../utils/meter-manufacturer.helper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";

export const bulkUploadMetersMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const METER_BULK_UPLOAD_TEMPLATE_PATH = path.join(
  process.cwd(),
  "src",
  "Manual Testing",
  "meter_bulk_upload_template (6).xlsx",
);

/** Approved template headers (sheet: meters). */
export const METER_BULK_UPLOAD_COLUMNS = [
  "Meter Serial Number",
  "Meter RAPDRP Code",
  "Asset ID",
  "MPTR",
  "MCTR",
  "LPTR",
  "LCTR",
  "MF",
  "Accuracy Class",
  "Meter PO Number",
  "Meter PO Date",
  "Meter Testing Date",
  "No. Of Display Digit",
  "Meter Manufacturer",
  "Meter Model",
  "Meter Version",
  "Meter Status",
  "DLMS / Non-DLMS",
  "Meter Rating",
] as const;

export const METER_BULK_UPLOAD_SHEET_NAME = "meters";

export const METER_BULK_UPLOAD_DLMS_VALUES = ["NA", "DLMS", "Non DLMS"] as const;

export interface BulkUploadFileInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export type MeterBulkUploadRow = Partial<
  Record<(typeof METER_BULK_UPLOAD_COLUMNS)[number], string | number>
>;

export interface BuildMeterBulkUploadOptions {
  columns?: string[];
  sheetName?: string;
  duplicateColumn?: string;
}

function uniqueSuffix(): string {
  return String(Date.now());
}

/** ≤16 chars; asset/RAPDRP match serial (manual doc §1). */
function buildBulkSerial(suffix: string = uniqueSuffix()): string {
  const digits =
    suffix.replace(/\D/g, "").slice(-10) || uniqueSuffix().slice(-10);
  return `M${digits}`;
}

function defaultManufacturerName(): string {
  return getStaticMeterManufacturerName();
}

export function getBulkMeterManufacturerName(): string {
  return defaultManufacturerName();
}

function defaultModelName(): string {
  return envValue("BULK_METER_MODEL_NAME");
}

/** Keep asset/RAPDRP/display-digit aligned with serial (manual doc §1). */
function applySerialToRow(row: MeterBulkUploadRow, serial: string): void {
  row["Meter Serial Number"] = serial;
  row["Meter RAPDRP Code"] = serial;
  row["Asset ID"] = serial;
  row["No. Of Display Digit"] = serial.length;
}

export function buildValidMeterBulkRow(
  suffix: string = uniqueSuffix(),
): MeterBulkUploadRow {
  const serial = buildBulkSerial(suffix);
  return {
    "Meter Serial Number": serial,
    "Meter RAPDRP Code": serial,
    "Asset ID": serial,
    MPTR: 1,
    MCTR: 1,
    LPTR: 1,
    LCTR: 1,
    MF: 1,
    "Accuracy Class": "1.0",
    "Meter PO Number": "PO-AUTO",
    "Meter PO Date": "2026-06-01",
    "Meter Testing Date": "2026-06-15",
    "No. Of Display Digit": serial.length,
    "Meter Manufacturer": defaultManufacturerName(),
    "Meter Model": defaultModelName(),
    "Meter Version": "v1",
    "Meter Status": "Connect",
    "DLMS / Non-DLMS": "NA",
    "Meter Rating": "10-40A",
  };
}

export async function buildMeterBulkUploadXlsx(
  dataRows: MeterBulkUploadRow[],
  options: BuildMeterBulkUploadOptions = {},
): Promise<Buffer> {
  const columns = options.columns ?? [...METER_BULK_UPLOAD_COLUMNS];
  const sheetName = options.sheetName ?? METER_BULK_UPLOAD_SHEET_NAME;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  const headerRow = [...columns];
  if (options.duplicateColumn) {
    headerRow.push(options.duplicateColumn);
  }
  sheet.addRow(headerRow);

  for (const row of dataRows) {
    sheet.addRow(
      columns.map((column) => {
        const value = row[column as keyof MeterBulkUploadRow];
        return value ?? "";
      }),
    );
    if (options.duplicateColumn) {
      const last = sheet.lastRow;
      if (last) {
        last.getCell(columns.length + 1).value =
          row[options.duplicateColumn as keyof MeterBulkUploadRow] ?? "";
      }
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function readOfficialMeterBulkTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(METER_BULK_UPLOAD_TEMPLATE_PATH);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export interface BulkUploadMetersTestCase {
  testName: string;
  scenario: BulkUploadMetersScenario;
  expectedStatus: number;
  buildUpload: () => Promise<BulkUploadFileInput>;
  /** Skip when any listed env var is empty. */
  envKeys?: string[];
  tags: string[];
}

function xlsxUpload(
  buffer: Buffer,
  fileName = `meter-bulk-${uniqueSuffix()}.xlsx`,
): BulkUploadFileInput {
  return {
    fileName,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
}

export const bulkUploadMetersTestCases: BulkUploadMetersTestCase[] = [
  // ─── File validation (manual doc) ────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — only .xlsx allowed",
    scenario: "file_invalid_type",
    expectedStatus: 400,
    buildUpload: async () => ({
      fileName: "meters-invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `${METER_BULK_UPLOAD_COLUMNS.join(",")}\nBULK-1,AUTO-RAP`,
        "utf8",
      ),
    }),
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — required columns must be present",
    scenario: "file_missing_columns",
    expectedStatus: 400,
    buildUpload: async () => {
      const columns = METER_BULK_UPLOAD_COLUMNS.filter(
        (c) => c !== "Meter Serial Number",
      );
      const buffer = await buildMeterBulkUploadXlsx(
        [buildValidMeterBulkRow("missing-col")],
        { columns: [...columns] },
      );
      return xlsxUpload(buffer, "meter-bulk-missing-columns.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — duplicate column names rejected",
    scenario: "file_duplicate_columns",
    expectedStatus: 400,
    buildUpload: async () => {
      const buffer = await buildMeterBulkUploadXlsx(
        [buildValidMeterBulkRow("dup-col")],
        { duplicateColumn: "Meter Serial Number" },
      );
      return xlsxUpload(buffer, "meter-bulk-duplicate-columns.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — at least one data row required",
    scenario: "file_no_data_rows",
    expectedStatus: 400,
    buildUpload: async () => {
      const buffer = await buildMeterBulkUploadXlsx([]);
      return xlsxUpload(buffer, "meter-bulk-header-only.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },

  // ─── Meter identification (manual doc §1) ────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — bulk create one meter",
    scenario: "bulk_success",
    expectedStatus: 200,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const buffer = await buildMeterBulkUploadXlsx([
        buildValidMeterBulkRow(),
      ]);
      return xlsxUpload(buffer);
    },
    tags: ["@smoke", "@master-data", "@bulk-upload-meters", "@meter-master"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — two unique meters created",
    scenario: "bulk_success_multi",
    expectedStatus: 200,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const suffix1 = uniqueSuffix();
      const suffix2 = String(Number(suffix1) + 1);
      const buffer = await buildMeterBulkUploadXlsx([
        buildValidMeterBulkRow(suffix1),
        buildValidMeterBulkRow(suffix2),
      ]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — blank rows ignored",
    scenario: "bulk_success_blank_row",
    expectedStatus: 200,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(METER_BULK_UPLOAD_SHEET_NAME);
      sheet.addRow([...METER_BULK_UPLOAD_COLUMNS]);
      sheet.addRow([]);
      const valid = buildValidMeterBulkRow();
      sheet.addRow(
        METER_BULK_UPLOAD_COLUMNS.map(
          (col) => valid[col as keyof MeterBulkUploadRow] ?? "",
        ),
      );
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return xlsxUpload(Buffer.from(arrayBuffer));
    },
    tags: ["@master-data", "@bulk-upload-meters"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — meter serial required",
    scenario: "row_missing_serial",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("no-serial");
      row["Meter Serial Number"] = "";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — duplicate serial within file",
    scenario: "row_duplicate_serial",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("dup");
      const serial = String(row["Meter Serial Number"]);
      applySerialToRow(row, serial);
      const buffer = await buildMeterBulkUploadXlsx([row, { ...row }]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — existing meter serial rejected",
    scenario: "row_already_exists",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const serial = getValidateMeterSerial("VALIDATE_ADD_METER_EXISTS_SERIAL");
      const row = buildValidMeterBulkRow("exists");
      applySerialToRow(row, serial);
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — asset and RAPDRP mismatch rejected",
    scenario: "row_asset_mismatch",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("asset-mis");
      row["Meter RAPDRP Code"] = "OTHER-RAP";
      row["Asset ID"] = "OTHER-ASSET";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },

  // ─── Meter master (manual doc §2) ────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — manufacturer must exist",
    scenario: "file_manufacturer_invalid",
    expectedStatus: 400,
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("bad-mfr");
      row["Meter Manufacturer"] = "INVALID_MANUFACTURER_XXXX";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — invalid DLMS value",
    scenario: "row_invalid_dlms",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("bad-dlms");
      row["DLMS / Non-DLMS"] = "INVALID";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — invalid meter model rejected",
    scenario: "row_invalid_model",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("bad-model");
      row["Meter Model"] = "INVALID_MODEL_XXXX";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — invalid meter status rejected",
    scenario: "row_invalid_meter_status",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("bad-status");
      row["Meter Status"] = "Inactive";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },

  // ─── Configuration (manual doc §3) ─────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — MF must be greater than zero",
    scenario: "row_mf_zero",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("mf-zero");
      row.MF = 0;
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — display digit must be positive",
    scenario: "row_display_digit_zero",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("digit-zero");
      row["No. Of Display Digit"] = 0;
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — MPTR must be non-negative",
    scenario: "row_negative_mptr",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("mptr-neg");
      row.MPTR = -1;
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — display digit must match serial length",
    scenario: "row_display_digit_mismatch",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("digit-mis");
      row["No. Of Display Digit"] = 99;
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — MCTR must be a valid integer",
    scenario: "row_invalid_mctr",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("mctr-bad");
      row.MCTR = "not-a-number";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — LPTR must be a valid integer",
    scenario: "row_invalid_lptr",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("lptr-bad");
      row.LPTR = "not-a-number";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — LCTR must be a valid integer",
    scenario: "row_invalid_lctr",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("lctr-bad");
      row.LCTR = "not-a-number";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },

  // ─── Date validation (manual doc §4) ───────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — Meter PO Date must be valid",
    scenario: "row_invalid_po_date",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("po-bad-date");
      row["Meter PO Date"] = "not-a-date";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — Meter Testing Date must be valid",
    scenario: "row_invalid_testing_date",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("test-bad-date");
      row["Meter Testing Date"] = "not-a-date";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — testing date before PO date rejected",
    scenario: "row_testing_before_po",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("date-order");
      row["Meter PO Date"] = "2026-06-15";
      row["Meter Testing Date"] = "2026-06-01";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — future PO date rejected",
    scenario: "row_future_date",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("future-date");
      row["Meter PO Date"] = "2099-01-01";
      row["Meter Testing Date"] = "2099-01-01";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },

  // ─── Field length (manual doc §5) ────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — accuracy class max 8 chars",
    scenario: "row_accuracy_too_long",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("acc-len");
      row["Accuracy Class"] = "123456789";
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — PO number max 32 chars",
    scenario: "row_po_number_too_long",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("po-len");
      row["Meter PO Number"] = "X".repeat(
        CREATE_METER_FIELD_LIMITS.meterPoNumber + 1,
      );
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — meter version max 32 chars",
    scenario: "row_version_too_long",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("ver-len");
      row["Meter Version"] = "X".repeat(
        CREATE_METER_FIELD_LIMITS.meterVersion + 1,
      );
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-meters — meter rating max 15 chars",
    scenario: "row_rating_too_long",
    expectedStatus: 400,
    envKeys: ["BULK_METER_MANUFACTURER_NAME"],
    buildUpload: async () => {
      const row = buildValidMeterBulkRow("rate-len");
      row["Meter Rating"] = "X".repeat(
        CREATE_METER_FIELD_LIMITS.meterRating + 1,
      );
      const buffer = await buildMeterBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-meters", "@negative"],
  },
];
