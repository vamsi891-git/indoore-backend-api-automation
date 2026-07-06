import path from "path";
import ExcelJS from "exceljs";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { BulkUploadConsumersScenario } from "../Mapper/bulk-upload-consumers.mapper";
import {
  hasConsumerAssignableMeterPool,
  nextConsumerAssignableMeterSerial,
  peekConsumerAssignableMeterSerial,
  setConsumerAssignableMeterPool,
} from "../../CONSUMERS/Data/consumer-assignable-meter-pool.data";
import {
  createConsumerData,
  ensureBulkConsumerExistingCid,
  ensureBulkConsumerNearestAcctId,
  existingConsumerCid,
  hasBulkConsumerExistingCid,
  hasBulkConsumerNearestAcctId,
  nearestAcctId,
} from "./create-consumer.data";

export {
  ensureBulkConsumerExistingCid,
  ensureBulkConsumerNearestAcctId,
  hasBulkConsumerExistingCid,
  hasBulkConsumerNearestAcctId,
};

export const bulkUploadConsumersMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const CONSUMER_BULK_UPLOAD_TEMPLATE_PATH = path.join(
  process.cwd(),
  "src",
  "Manual Testing",
  "consumer_bulk_upload_template (1).xlsx",
);

export const CONSUMER_BULK_UPLOAD_COLUMNS = [
  "Zone",
  "Consumer ID",
  "Consumer Name",
  "Father Name",
  "Email ID",
  "Mobile No.",
  "Land Line No.",
  "Address",
  "Pin Code",
  "Sub Station",
  "Feeder",
  "DTR",
  "IVRS Number",
  "Account ID",
  "Nearest Acct. ID",
  "Total Demand (KVA)",
  "Sanctioned Load (KW)",
  "Sanctioned Load (HP)",
  "Connected KVA",
  "Connected KW",
  "Connected HP",
  "Rated KVA",
  "Rated KW",
  "Connection Type",
  "Billing Cycle",
  "Bill Day",
  "Consumer Category",
  "Nature Of Business",
  "Connection Status",
  "TOD",
  "MR Code",
  "Main/Sub Meter",
  "MSN",
  "Service Point ID",
  "Date Of Service",
  "Meter Phase",
  "Connected To DCU",
  "SIM No.",
  "IMSI No.",
  "Mobile No. (Meter)",
  "IP Address",
  "Modem Serial Number",
  "Modem IMEI",
  "Meter Initial Reading",
  "Is Net Meter",
  "Activate/Deactivate Remarks",
] as const;

export const CONSUMER_BULK_UPLOAD_SHEET_NAME = "consumers";

const CONSUMER_BULK_UPLOAD_TEXT_COLUMNS = new Set<string>([
  "Zone",
  "Consumer ID",
  "Consumer Name",
  "Father Name",
  "Email ID",
  "Mobile No.",
  "Land Line No.",
  "Address",
  "Pin Code",
  "Sub Station",
  "Feeder",
  "DTR",
  "IVRS Number",
  "Account ID",
  "Nearest Acct. ID",
  "Connection Type",
  "Billing Cycle",
  "Consumer Category",
  "Nature Of Business",
  "Connection Status",
  "TOD",
  "MR Code",
  "Main/Sub Meter",
  "MSN",
  "Service Point ID",
  "Date Of Service",
  "Meter Phase",
  "SIM No.",
  "IMSI No.",
  "Mobile No. (Meter)",
  "IP Address",
  "Modem Serial Number",
  "Modem IMEI",
  "Activate/Deactivate Remarks",
]);

export const CONSUMER_BULK_UPLOAD_HIERARCHY_ENV_KEYS = [
  "BULK_DTR_ZONE_NAME",
  "BULK_DTR_SUBSTATION_NAME",
  "BULK_DTR_FEEDER_NAME",
] as const;

export interface BulkUploadFileInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export type ConsumerBulkUploadRow = Partial<
  Record<(typeof CONSUMER_BULK_UPLOAD_COLUMNS)[number], string | number | boolean>
>;

export interface BuildConsumerBulkUploadOptions {
  columns?: string[];
  sheetName?: string;
  duplicateColumn?: string;
}

export function setBulkConsumerMeterPool(serials: string[]): void {
  setConsumerAssignableMeterPool(serials);
}

export function hasBulkConsumerMeterPool(): boolean {
  return hasConsumerAssignableMeterPool();
}

export const bulkUploadConsumerOrganisationLookupId =
  createConsumerData.organisationLookupId;

function envValue(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function uniqueSuffix(): string {
  return String(Date.now());
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function uniqueConsumerId(): string {
  return `CID-BULK-${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function peekBulkConsumerMeterSerial(): string {
  const provisioned = peekConsumerAssignableMeterSerial();
  if (provisioned) {
    return provisioned;
  }
  return envValue("BULK_CONSUMER_METER_SERIAL") || "MSN_INVALID_NONEXISTENT_00000";
}

function nextBulkConsumerMeterSerial(): string {
  const provisioned = nextConsumerAssignableMeterSerial();
  if (provisioned) {
    return provisioned;
  }
  return peekBulkConsumerMeterSerial();
}

function zoneName(): string {
  return envValue("BULK_DTR_ZONE_NAME") || "Hawabangla";
}

function subStationName(): string {
  return envValue("BULK_DTR_SUBSTATION_NAME") || "PragatiNagar";
}

function feederName(): string {
  return envValue("BULK_DTR_FEEDER_NAME") || "PARMANU NAGAR(CHQ)";
}

function dtrName(): string {
  return (
    envValue("BULK_CONSUMER_DTR_NAME") ||
    envValue("CREATE_DTR_EXISTS_CODE") ||
    "RJ662"
  );
}

function tenDigitMobile(): string {
  return `98${String(Date.now()).slice(-8)}`;
}

function mainSubMeterName(): string {
  return envValue("BULK_DTR_MAIN_SUB_METER") || "Main";
}

function meterPhaseName(): string {
  return envValue("BULK_DTR_METER_PHASE") || "1 PH";
}

export function buildValidConsumerBulkRow(
  options?: {
    meterSerial?: string;
    consumerId?: string;
    ivrsNumber?: string;
    accountId?: string;
    nearestAcctId?: string;
    label?: string;
    allocateMeter?: boolean;
  },
): ConsumerBulkUploadRow {
  const today = isoToday();
  const label = options?.label ?? uniqueSuffix();
  const stamp = String(Date.now()).slice(-8);
  const consumerId = options?.consumerId ?? uniqueConsumerId();
  const meterSerial =
    options?.meterSerial ??
    (options?.allocateMeter
      ? nextBulkConsumerMeterSerial()
      : peekBulkConsumerMeterSerial());

  return {
    Zone: zoneName(),
    "Consumer ID": consumerId,
    "Consumer Name": `Auto Consumer ${label}`,
    "Father Name": "Suresh Kumar",
    "Email ID": `auto.${label}@example.com`,
    "Mobile No.": tenDigitMobile(),
    "Land Line No.": "07312551234",
    Address: "12 MG Road, Indore",
    "Pin Code": "452001",
    "Sub Station": subStationName(),
    Feeder: feederName(),
    DTR: dtrName(),
    "IVRS Number": options?.ivrsNumber ?? consumerId,
    "Account ID": options?.accountId ?? consumerId,
    "Nearest Acct. ID": options?.nearestAcctId ?? nearestAcctId(),
    "Total Demand (KVA)": 5,
    "Sanctioned Load (KW)": 4,
    "Sanctioned Load (HP)": 5.5,
    "Connected KVA": 4,
    "Connected KW": 3.5,
    "Connected HP": 4.5,
    "Rated KVA": 5,
    "Rated KW": 4,
    "Connection Type": createConsumerData.connectionTypeId,
    "Billing Cycle": 1,
    "Bill Day": 5,
    "Consumer Category": createConsumerData.consumerCategoryId,
    "Nature Of Business": "Commercial",
    "Connection Status": createConsumerData.connectionStatusId,
    TOD: 1,
    "MR Code": "MR01",
    "Main/Sub Meter": mainSubMeterName(),
    MSN: meterSerial,
    "Service Point ID": `SP${stamp}`,
    "Date Of Service": today,
    "Meter Phase": meterPhaseName(),
    "Connected To DCU": true,
    "SIM No.": "9900000001",
    "IMSI No.": "404010123456789",
    "Mobile No. (Meter)": "9876501234",
    "IP Address": "192.168.1.100",
    "Modem Serial Number": `MOD${stamp}`,
    "Modem IMEI": "359072069367200",
    "Meter Initial Reading": 1,
    "Is Net Meter": false,
    "Activate/Deactivate Remarks": "Automation bulk-upload-consumers",
  };
}

export async function buildConsumerBulkUploadXlsx(
  dataRows: ConsumerBulkUploadRow[],
  options: BuildConsumerBulkUploadOptions = {},
): Promise<Buffer> {
  const columns = options.columns ?? [...CONSUMER_BULK_UPLOAD_COLUMNS];
  const sheetName = options.sheetName ?? CONSUMER_BULK_UPLOAD_SHEET_NAME;
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
        const value = row[column as keyof ConsumerBulkUploadRow];
        if (value == null || value === "") {
          return "";
        }
        if (CONSUMER_BULK_UPLOAD_TEXT_COLUMNS.has(column)) {
          return String(value);
        }
        return value;
      }),
    );
    columns.forEach((column, index) => {
      if (!CONSUMER_BULK_UPLOAD_TEXT_COLUMNS.has(column)) {
        return;
      }
      const cell = addedRow.getCell(index + 1);
      const value = row[column as keyof ConsumerBulkUploadRow];
      cell.value = value == null || value === "" ? "" : String(value);
      cell.numFmt = "@";
    });
    if (options.duplicateColumn) {
      const dupCell = addedRow.getCell(columns.length + 1);
      const dupValue = row[options.duplicateColumn as keyof ConsumerBulkUploadRow];
      dupCell.value = dupValue == null || dupValue === "" ? "" : String(dupValue);
      dupCell.numFmt = "@";
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export interface BulkUploadConsumersTestCase {
  testName: string;
  scenario: BulkUploadConsumersScenario;
  expectedStatus: number;
  buildUpload: () => Promise<BulkUploadFileInput>;
  envKeys?: string[];
  tags: string[];
}

function xlsxUpload(
  buffer: Buffer,
  fileName = `consumer-bulk-${uniqueSuffix()}.xlsx`,
): BulkUploadFileInput {
  return {
    fileName,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
}

const hierarchyEnvKeys = [...CONSUMER_BULK_UPLOAD_HIERARCHY_ENV_KEYS];

export const bulkUploadConsumersTestCases: BulkUploadConsumersTestCase[] = [
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — only .xlsx allowed",
    scenario: "file_invalid_type",
    expectedStatus: 400,
    buildUpload: async () => ({
      fileName: "consumers-invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `${CONSUMER_BULK_UPLOAD_COLUMNS.join(",")}\nCID1,Test`,
        "utf8",
      ),
    }),
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — required columns must be present",
    scenario: "file_missing_columns",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const columns = CONSUMER_BULK_UPLOAD_COLUMNS.filter(
        (c) => c !== "Consumer ID",
      );
      const buffer = await buildConsumerBulkUploadXlsx(
        [buildValidConsumerBulkRow({ label: "missing-col" })],
        { columns: [...columns] },
      );
      return xlsxUpload(buffer, "consumer-bulk-missing-columns.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — duplicate column names rejected",
    scenario: "file_duplicate_columns",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx(
        [buildValidConsumerBulkRow({ label: "dup-col" })],
        { duplicateColumn: "Consumer ID" },
      );
      return xlsxUpload(buffer, "consumer-bulk-duplicate-columns.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — at least one data row required",
    scenario: "file_no_data_rows",
    expectedStatus: 400,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx([]);
      return xlsxUpload(buffer, "consumer-bulk-header-only.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Zone must exist",
    scenario: "file_invalid_zone",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-zone" });
      row.Zone = "ZONE_INVALID_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Consumer ID required",
    scenario: "row_missing_consumer_id",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "no-cid" });
      row["Consumer ID"] = "";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — duplicate Consumer ID within file",
    scenario: "row_duplicate_consumer_id",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const cid = uniqueConsumerId();
      const row1 = buildValidConsumerBulkRow({
        consumerId: cid,
        label: "dup-a",
      });
      const row2 = buildValidConsumerBulkRow({
        consumerId: cid,
        label: "dup-b",
      });
      const buffer = await buildConsumerBulkUploadXlsx([row1, row2]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — existing Consumer ID rejected",
    scenario: "row_consumer_id_exists",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        consumerId: existingConsumerCid(),
        label: "exists",
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Nearest Account ID must be valid",
    scenario: "row_invalid_nearest_acct_id",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        label: "bad-nearest",
        nearestAcctId: "NEAREST_INVALID_XXXX",
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Nearest Account ID required",
    scenario: "row_missing_nearest_acct_id",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        label: "no-nearest",
        nearestAcctId: "",
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Bill Day must be between 1 and 28 (above range)",
    scenario: "row_invalid_bill_day",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-bill-day-high" });
      row["Bill Day"] = 31;
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Bill Day must be between 1 and 28 (below range)",
    scenario: "row_invalid_bill_day_zero",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-bill-day-zero" });
      row["Bill Day"] = 0;
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Consumer Category must be valid",
    scenario: "row_invalid_consumer_category",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-category" });
      row["Consumer Category"] = "INVALID_CATEGORY_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Billing Cycle must be valid",
    scenario: "row_invalid_billing_cycle",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-billing" });
      row["Billing Cycle"] = "INVALID_BILLING_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Connection Type must be valid",
    scenario: "row_invalid_connection_type",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-conn-type" });
      row["Connection Type"] = "INVALID_CONN_TYPE_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Connection Status must be valid",
    scenario: "row_invalid_connection_status",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-conn-status" });
      row["Connection Status"] = "INVALID_STATUS_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — TOD must be valid",
    scenario: "row_invalid_tod",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-tod" });
      row.TOD = "INVALID_TOD_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Sub Station must belong to Zone",
    scenario: "row_invalid_substation",
    expectedStatus: 400,
    envKeys: ["BULK_DTR_ZONE_NAME", "BULK_DTR_FEEDER_NAME"],
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-ss" });
      row.Zone = zoneName();
      row["Sub Station"] = "SS_INVALID_XXXX";
      row.Feeder = feederName();
      row.DTR = dtrName();
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Feeder must belong to hierarchy",
    scenario: "row_invalid_feeder",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-feeder" });
      row.Feeder = "FEEDER_INVALID_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — DTR must be valid",
    scenario: "row_invalid_dtr",
    expectedStatus: 400,
    envKeys: ["BULK_DTR_ZONE_NAME", "BULK_DTR_SUBSTATION_NAME", "BULK_DTR_FEEDER_NAME"],
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-dtr" });
      row.DTR = "DTR_INVALID_XXXX";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — MSN required",
    scenario: "row_missing_msn",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "no-msn" });
      row.MSN = "";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — meter must exist",
    scenario: "row_meter_not_found",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        label: "msn-missing",
        meterSerial: `Z${Date.now().toString().slice(-11)}`,
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — meter must be active",
    scenario: "row_meter_inactive",
    expectedStatus: 400,
    envKeys: [...hierarchyEnvKeys, "VALIDATE_DTR_METER_INACTIVE_SERIAL"],
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        label: "msn-inactive",
        meterSerial: envValue("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — meter must not already be mapped",
    scenario: "row_meter_already_mapped",
    expectedStatus: 400,
    envKeys: [...hierarchyEnvKeys, "VALIDATE_DTR_METER_ASSIGNED_SERIAL"],
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        label: "msn-mapped",
        meterSerial: envValue("VALIDATE_DTR_METER_ASSIGNED_SERIAL"),
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Main/Sub Meter must be valid",
    scenario: "row_invalid_main_sub_meter",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-main-sub" });
      row["Main/Sub Meter"] = "MAYBE";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Meter Phase must be valid",
    scenario: "row_invalid_meter_phase",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-phase" });
      row["Meter Phase"] = "QUAD";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Service Point ID required",
    scenario: "row_missing_service_point",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "no-sp" });
      row["Service Point ID"] = "";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Meter Initial Reading must be greater than zero",
    scenario: "row_reading_zero",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "reading-zero" });
      row["Meter Initial Reading"] = 0;
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — SIM No. required",
    scenario: "row_missing_sim",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "no-sim" });
      row["SIM No."] = "";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — IMSI No. must contain digits only",
    scenario: "row_invalid_imsi",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-imsi" });
      row["IMSI No."] = "IMSI-ABC";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Meter Mobile Number must contain 10 digits",
    scenario: "row_invalid_meter_mobile",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-mobile" });
      row["Mobile No. (Meter)"] = "12345";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — IP Address must be valid",
    scenario: "row_invalid_ip",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-ip" });
      row["IP Address"] = "999.999.999.999";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Modem Serial Number required",
    scenario: "row_missing_modem_serial",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "no-modem" });
      row["Modem Serial Number"] = "";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — Modem IMEI must be 15 digits",
    scenario: "row_invalid_imei",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-imei" });
      row["Modem IMEI"] = "12345";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — duplicate MSN within file",
    scenario: "row_duplicate_msn",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const msn = peekBulkConsumerMeterSerial();
      const row1 = buildValidConsumerBulkRow({ label: "dup-msn-a", meterSerial: msn });
      const row2 = buildValidConsumerBulkRow({ label: "dup-msn-b", meterSerial: msn });
      const buffer = await buildConsumerBulkUploadXlsx([row1, row2]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — bulk create one consumer",
    scenario: "bulk_success",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx([
        buildValidConsumerBulkRow({ label: "success-1", allocateMeter: true }),
      ]);
      return xlsxUpload(buffer);
    },
    tags: ["@smoke", "@master-data", "@bulk-upload-consumers", "@consumer", "@positive"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — two unique consumers created",
    scenario: "bulk_success_multi",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx([
        buildValidConsumerBulkRow({ label: "multi-1", allocateMeter: true }),
        buildValidConsumerBulkRow({ label: "multi-2", allocateMeter: true }),
      ]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@consumer", "@positive"],
  },
  {
    testName:
      "Validate POST /indore/master-data/bulk-upload-consumers — blank rows ignored",
    scenario: "bulk_success_blank_row",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(CONSUMER_BULK_UPLOAD_SHEET_NAME);
      sheet.addRow([...CONSUMER_BULK_UPLOAD_COLUMNS]);
      sheet.addRow([]);
      const valid = buildValidConsumerBulkRow({
        label: "blank-row",
        allocateMeter: true,
      });
      const dataRow = sheet.addRow(
        CONSUMER_BULK_UPLOAD_COLUMNS.map((col) => {
          const value = valid[col as keyof ConsumerBulkUploadRow];
          if (CONSUMER_BULK_UPLOAD_TEXT_COLUMNS.has(col)) {
            return value == null || value === "" ? "" : String(value);
          }
          return value ?? "";
        }),
      );
      CONSUMER_BULK_UPLOAD_COLUMNS.forEach((column, index) => {
        if (!CONSUMER_BULK_UPLOAD_TEXT_COLUMNS.has(column)) {
          return;
        }
        const value = valid[column as keyof ConsumerBulkUploadRow];
        const cell = dataRow.getCell(index + 1);
        cell.value = value == null || value === "" ? "" : String(value);
        cell.numFmt = "@";
      });
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return xlsxUpload(Buffer.from(arrayBuffer));
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@consumer", "@positive"],
  },
];
