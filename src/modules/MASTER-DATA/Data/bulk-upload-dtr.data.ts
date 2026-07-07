import path from "path";
import ExcelJS from "exceljs";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { BulkUploadDtrScenario } from "../Mapper/bulk-upload-dtr.mapper";
import {
  hasDtrAssignableMeterPool,
  nextDtrAssignableMeterSerial,
  peekDtrAssignableMeterSerial,
  setDtrAssignableMeterPool,
} from "./dtr-assignable-meter-pool.data";
import { resolveMasterDataEnv as envValue } from "../utils/master-data-env.helper";
import {
  getCascadeFeederName,
  getCascadeSubStationName,
  getCascadeZoneName,
} from "../utils/network-hierarchy-cascade.helper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";

export const bulkUploadDtrMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const DTR_BULK_UPLOAD_TEMPLATE_PATH = path.join(
  process.cwd(),
  "src",
  "Manual Testing",
  "dtr_bulk_upload_template (4).xlsx",
);

export const DTR_BULK_UPLOAD_COLUMNS = [
  "Zone",
  "Sub Station",
  "Feeder",
  "DTR Code",
  "DTR Name",
  "DTR Capacity (KVA)",
  "Status",
  "Service Date",
  "EntryDateTime",
  "Meter Serial Number",
  "Main/Sub Meter",
  "Service Point ID",
  "Meter Phase",
  "Connected To DCU",
  "SIM No.",
  "IMSI No.",
  "IP Address",
  "Modem Serial Number",
  "Modem IMEI",
  "Meter Initial Reading",
  "Latitude",
  "Longitude",
  "DTR Address",
  "Remarks",
] as const;

export const DTR_BULK_UPLOAD_SHEET_NAME = "dtrs";

/** Excel must keep these as text (e.g. "1 PH" must not become numeric 1). */
const DTR_BULK_UPLOAD_TEXT_COLUMNS = new Set<string>([
  "Zone",
  "Sub Station",
  "Feeder",
  "DTR Code",
  "DTR Name",
  "Status",
  "Service Date",
  "EntryDateTime",
  "Meter Serial Number",
  "Main/Sub Meter",
  "Service Point ID",
  "Meter Phase",
  "SIM No.",
  "IMSI No.",
  "IP Address",
  "Modem Serial Number",
  "Modem IMEI",
  "Latitude",
  "Longitude",
  "DTR Address",
  "Remarks",
]);

export const DTR_BULK_UPLOAD_HIERARCHY_ENV_KEYS = [
  "BULK_DTR_ZONE_NAME",
  "BULK_DTR_SUBSTATION_NAME",
  "BULK_DTR_FEEDER_NAME",
] as const;

export interface BulkUploadFileInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export type DtrBulkUploadRow = Partial<
  Record<(typeof DTR_BULK_UPLOAD_COLUMNS)[number], string | number | boolean>
>;

export interface BuildDtrBulkUploadOptions {
  columns?: string[];
  sheetName?: string;
  duplicateColumn?: string;
}

export const BULK_DTR_UNMAPPED_METER_CANDIDATES = [
  "93041027",
  "85092394",
  "85119166",
  "85104185",
  "97788461",
] as const;

export function setBulkDtrMeterPool(serials: string[]): void {
  setDtrAssignableMeterPool(serials);
}

export function hasBulkDtrMeterPool(): boolean {
  return hasDtrAssignableMeterPool();
}

function uniqueSuffix(): string {
  return String(Date.now());
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

let bulkDtrCodeSequence = 0;

function uniqueDtrCode(): string {
  bulkDtrCodeSequence += 1;
  const tail = `${Date.now()}${bulkDtrCodeSequence}${Math.floor(Math.random() * 100)}`.slice(-13);
  return `DTR${tail}`.slice(0, 16);
}

function peekBulkDtrMeterSerial(): string {
  const provisioned = peekDtrAssignableMeterSerial();
  if (provisioned) {
    return provisioned;
  }
  return envValue("BULK_DTR_METER_SERIAL") || "MSN_INVALID_NONEXISTENT_00000";
}

function nextBulkDtrMeterSerial(): string {
  const provisioned = nextDtrAssignableMeterSerial();
  if (provisioned) {
    return provisioned;
  }
  return peekBulkDtrMeterSerial();
}

function zoneName(): string {
  return getCascadeZoneName();
}

function subStationName(): string {
  return getCascadeSubStationName();
}

function feederName(): string {
  return getCascadeFeederName();
}

function mainSubMeterName(): string {
  return envValue("BULK_DTR_MAIN_SUB_METER") || "Main";
}

function meterPhaseName(): string {
  return envValue("BULK_DTR_METER_PHASE") || "1 PH";
}

export function buildValidDtrBulkRow(
  options?: {
    meterSerial?: string;
    dtrCode?: string;
    label?: string;
    /** When true, rotates through the provisioned meter pool (success / multi-row uploads). */
    allocateMeter?: boolean;
  },
): DtrBulkUploadRow {
  const today = isoToday();
  const label = options?.label ?? uniqueSuffix();
  const stamp = `${label}${String(Date.now()).slice(-6)}`;
  const meterSerial =
    options?.meterSerial ??
    (options?.allocateMeter ? nextBulkDtrMeterSerial() : peekBulkDtrMeterSerial());

  return {
    Zone: zoneName(),
    "Sub Station": subStationName(),
    Feeder: feederName(),
    "DTR Code": options?.dtrCode ?? uniqueDtrCode(),
    "DTR Name": `Auto DTR ${label}`,
    "DTR Capacity (KVA)": 25,
    Status: "active",
    "Service Date": today,
    EntryDateTime: today,
    "Meter Serial Number": meterSerial,
    "Main/Sub Meter": mainSubMeterName(),
    "Service Point ID": `SP${stamp}`,
    "Meter Phase": meterPhaseName(),
    "Connected To DCU": true,
    "SIM No.": "9900000001",
    "IMSI No.": "404010123456789",
    "IP Address": "192.168.1.100",
    "Modem Serial Number": `MOD${stamp}`,
    "Modem IMEI": "359072069367200",
    "Meter Initial Reading": 1,
    Latitude: "22.7196",
    Longitude: "75.8577",
    "DTR Address": "Test address",
    Remarks: "Automation bulk-upload-dtr",
  };
}

export async function buildDtrBulkUploadXlsx(
  dataRows: DtrBulkUploadRow[],
  options: BuildDtrBulkUploadOptions = {},
): Promise<Buffer> {
  const columns = options.columns ?? [...DTR_BULK_UPLOAD_COLUMNS];
  const sheetName = options.sheetName ?? DTR_BULK_UPLOAD_SHEET_NAME;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  const headerRow = [...columns];
  if (options.duplicateColumn) {
    headerRow.push(options.duplicateColumn);
  }
  sheet.addRow(headerRow);

  for (const row of dataRows) {
    const addedRow = sheet.addRow(
      columns.map((column) => {
        const value = row[column as keyof DtrBulkUploadRow];
        if (value == null || value === "") {
          return "";
        }
        if (DTR_BULK_UPLOAD_TEXT_COLUMNS.has(column)) {
          return String(value);
        }
        return value;
      }),
    );
    columns.forEach((column, index) => {
      if (!DTR_BULK_UPLOAD_TEXT_COLUMNS.has(column)) {
        return;
      }
      const cell = addedRow.getCell(index + 1);
      const value = row[column as keyof DtrBulkUploadRow];
      cell.value = value == null || value === "" ? "" : String(value);
      cell.numFmt = "@";
    });
    if (options.duplicateColumn) {
      const dupCell = addedRow.getCell(columns.length + 1);
      const dupValue = row[options.duplicateColumn as keyof DtrBulkUploadRow];
      dupCell.value = dupValue == null || dupValue === "" ? "" : String(dupValue);
      dupCell.numFmt = "@";
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export interface BulkUploadDtrTestCase {
  testName: string;
  scenario: BulkUploadDtrScenario;
  expectedStatus: number;
  buildUpload: () => Promise<BulkUploadFileInput>;
  envKeys?: string[];
  tags: string[];
}

function xlsxUpload(
  buffer: Buffer,
  fileName = `dtr-bulk-${uniqueSuffix()}.xlsx`,
): BulkUploadFileInput {
  return {
    fileName,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
}

const hierarchyEnvKeys = [...DTR_BULK_UPLOAD_HIERARCHY_ENV_KEYS];

export const bulkUploadDtrTestCases: BulkUploadDtrTestCase[] = [
  // ─── File validation ─────────────────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — only .xlsx allowed",
    scenario: "file_invalid_type",
    expectedStatus: 400,
    buildUpload: async () => ({
      fileName: "dtrs-invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `${DTR_BULK_UPLOAD_COLUMNS.join(",")}\nDTR1,Test`,
        "utf8",
      ),
    }),
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — required columns must be present",
    scenario: "file_missing_columns",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const columns = DTR_BULK_UPLOAD_COLUMNS.filter((c) => c !== "DTR Code");
      const buffer = await buildDtrBulkUploadXlsx(
        [buildValidDtrBulkRow({ label: "missing-col" })],
        { columns: [...columns] },
      );
      return xlsxUpload(buffer, "dtr-bulk-missing-columns.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — duplicate column names rejected",
    scenario: "file_duplicate_columns",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildDtrBulkUploadXlsx(
        [buildValidDtrBulkRow({ label: "dup-col" })],
        { duplicateColumn: "DTR Code" },
      );
      return xlsxUpload(buffer, "dtr-bulk-duplicate-columns.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — at least one data row required",
    scenario: "file_no_data_rows",
    expectedStatus: 400,
    buildUpload: async () => {
      const buffer = await buildDtrBulkUploadXlsx([]);
      return xlsxUpload(buffer, "dtr-bulk-header-only.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Zone must exist",
    scenario: "file_invalid_zone",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-zone" });
      row.Zone = "ZONE_INVALID_XXXX";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },

  // ─── DTR validation (manual §1) ──────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — DTR Code required",
    scenario: "row_missing_dtr_code",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "no-code" });
      row["DTR Code"] = "";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — DTR Name required",
    scenario: "row_missing_dtr_name",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "no-name" });
      row["DTR Name"] = "";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — duplicate DTR Code within file",
    scenario: "row_duplicate_dtr_code",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const code = uniqueDtrCode();
      const row1 = buildValidDtrBulkRow({ dtrCode: code, label: "dup-a" });
      const row2 = buildValidDtrBulkRow({ dtrCode: code, label: "dup-b" });
      const buffer = await buildDtrBulkUploadXlsx([row1, row2]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — existing DTR Code rejected",
    scenario: "row_dtr_code_exists",
    expectedStatus: 400,
    envKeys: [...hierarchyEnvKeys, "CREATE_DTR_EXISTS_CODE"],
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({
        dtrCode: envValue("CREATE_DTR_EXISTS_CODE"),
        label: "exists",
      });
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — DTR Capacity must be greater than zero",
    scenario: "row_capacity_zero",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "cap-zero" });
      row["DTR Capacity (KVA)"] = 0;
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Status must be valid",
    scenario: "row_invalid_status",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-status" });
      row.Status = "MAYBE";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },

  // ─── Network hierarchy ───────────────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Sub Station must belong to Zone",
    scenario: "row_invalid_substation",
    expectedStatus: 400,
    envKeys: ["BULK_DTR_ZONE_NAME", "BULK_DTR_FEEDER_NAME"],
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-ss" });
      row.Zone = zoneName();
      row["Sub Station"] = "SS_INVALID_XXXX";
      row.Feeder = feederName();
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },

  // ─── Meter mapping (manual §2) ───────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Meter Serial Number required",
    scenario: "row_missing_meter_serial",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "no-msn" });
      row["Meter Serial Number"] = "";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — meter must exist",
    scenario: "row_meter_not_found",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({
        label: "msn-missing",
        meterSerial: `Z${Date.now().toString().slice(-11)}`,
      });
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — meter must be active",
    scenario: "row_meter_inactive",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({
        label: "msn-inactive",
        meterSerial: getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
      });
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative", "@backend-defect"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — meter already on another DTR",
    scenario: "row_meter_on_dtr",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({
        label: "msn-on-dtr",
        meterSerial: getValidateMeterSerial("VALIDATE_DTR_METER_ON_DTR_SERIAL"),
      });
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Main/Sub Meter must be valid",
    scenario: "row_invalid_main_sub_meter",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-main-sub" });
      row["Main/Sub Meter"] = "MAYBE";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Meter Phase must be valid",
    scenario: "row_invalid_meter_phase",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-phase" });
      row["Meter Phase"] = "QUAD";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Service Point ID required",
    scenario: "row_missing_service_point",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "no-sp" });
      row["Service Point ID"] = "";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },

  // ─── Communication (manual §3) ───────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — SIM No. required",
    scenario: "row_missing_sim",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "no-sim" });
      row["SIM No."] = "";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — IMSI No. must contain digits only",
    scenario: "row_invalid_imsi",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-imsi" });
      row["IMSI No."] = "IMSI-ABC";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — IP Address must be valid",
    scenario: "row_invalid_ip",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-ip" });
      row["IP Address"] = "999.999.999.999";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Modem Serial Number required",
    scenario: "row_missing_modem_serial",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "no-modem" });
      row["Modem Serial Number"] = "";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Modem IMEI must be 15 digits",
    scenario: "row_invalid_imei",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-imei" });
      row["Modem IMEI"] = "12345";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },

  // ─── Date validation (manual §4) ─────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Service Date must be valid",
    scenario: "row_invalid_service_date",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "bad-svc-date" });
      row["Service Date"] = "not-a-date";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — future Service Date rejected",
    scenario: "row_future_service_date",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "future-svc" });
      row["Service Date"] = "2099-01-01";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — future EntryDateTime rejected",
    scenario: "row_future_entry_date",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "future-entry" });
      row.EntryDateTime = "2099-01-01";
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — Meter Initial Reading must be greater than zero",
    scenario: "row_reading_zero",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidDtrBulkRow({ label: "reading-zero" });
      row["Meter Initial Reading"] = 0;
      const buffer = await buildDtrBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr", "@negative"],
  },

  // ─── Success (run after negatives so assignable meters are not consumed early) ─
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — bulk create one DTR",
    scenario: "bulk_success",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildDtrBulkUploadXlsx([
        buildValidDtrBulkRow({ label: "success-1", allocateMeter: true }),
      ]);
      return xlsxUpload(buffer);
    },
    tags: ["@smoke", "@master-data", "@bulk-upload-dtr", "@dtr-master"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — two unique DTRs created",
    scenario: "bulk_success_multi",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildDtrBulkUploadXlsx([
        buildValidDtrBulkRow({ label: "multi-1", allocateMeter: true }),
        buildValidDtrBulkRow({ label: "multi-2", allocateMeter: true }),
      ]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-dtr"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-dtr — blank rows ignored",
    scenario: "bulk_success_blank_row",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(DTR_BULK_UPLOAD_SHEET_NAME);
      sheet.addRow([...DTR_BULK_UPLOAD_COLUMNS]);
      sheet.addRow([]);
      const valid = buildValidDtrBulkRow({ label: "blank-row", allocateMeter: true });
      const dataRow = sheet.addRow(
        DTR_BULK_UPLOAD_COLUMNS.map((col) => {
          const value = valid[col as keyof DtrBulkUploadRow];
          if (DTR_BULK_UPLOAD_TEXT_COLUMNS.has(col)) {
            return value == null || value === "" ? "" : String(value);
          }
          return value ?? "";
        }),
      );
      DTR_BULK_UPLOAD_COLUMNS.forEach((column, index) => {
        if (!DTR_BULK_UPLOAD_TEXT_COLUMNS.has(column)) {
          return;
        }
        const value = valid[column as keyof DtrBulkUploadRow];
        const cell = dataRow.getCell(index + 1);
        cell.value = value == null || value === "" ? "" : String(value);
        cell.numFmt = "@";
      });
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return xlsxUpload(Buffer.from(arrayBuffer));
    },
    tags: ["@master-data", "@bulk-upload-dtr"],
  },
];
