import path from "path";
import { randomBytes } from "crypto";
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
  getConsumerHierarchyLabels,
  hasBulkConsumerExistingCid,
  hasBulkConsumerNearestAcctId,
  nearestAcctId,
} from "./create-consumer.data";
import {
  getBillingCycleBulkValue,
  getConnectionStatusBulkValue,
  getConnectionTypeBulkValue,
  getConsumerCategoryBulkValue,
  getMainSubMeterBulkValue,
  getMeterPhaseBulkValue,
  getTodBulkValue,
} from "../utils/consumer-lookup.helper";
import { resolveMasterDataEnv as envValue } from "../utils/master-data-env.helper";
import { ensureConsumerBulkHierarchyContext } from "../utils/network-hierarchy-cascade.helper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";

export {
  ensureBulkConsumerExistingCid,
  ensureBulkConsumerNearestAcctId,
  ensureConsumerBulkHierarchyContext,
  hasBulkConsumerExistingCid,
  hasBulkConsumerNearestAcctId,
};

export const bulkUploadConsumersMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

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

export const bulkUploadConsumerOrganisationLookupId = createConsumerData.organisationLookupId;

function uniqueSuffix(): string {
  return String(Date.now());
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

let bulkConsumerIdSequence = 0;

function uniqueConsumerId(): string {
  bulkConsumerIdSequence += 1;
  const tail = `${Date.now()}${bulkConsumerIdSequence}${Math.floor(Math.random() * 100)}`.slice(
    -16,
  );
  return `CID${tail}`;
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
  return getConsumerHierarchyLabels().zone;
}

function subStationName(): string {
  return getConsumerHierarchyLabels().subStation;
}

function feederName(): string {
  return getConsumerHierarchyLabels().feeder;
}

function dtrName(): string {
  return getConsumerHierarchyLabels().dtr;
}

let bulkConsumerRowSequence = 0;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function uniqueFifteenDigitId(seed: string): string {
  const digits = `${seed}${Date.now()}${Math.floor(Math.random() * 10000)}`.replace(/\D/g, "");
  return digits.padEnd(15, "7").slice(0, 15);
}

function uniqueModemIdentity(seed: string): {
  servicePointId: string;
  simNumber: string;
  imsiNumber: string;
  meterMobile: string;
  ipAddress: string;
  modemSerial: string;
  modemImei: string;
} {
  const nonce = randomBytes(6).toString("hex");
  const identitySeed = `${seed}-${nonce}`;
  const hash = hashSeed(identitySeed);
  return {
    servicePointId: `SP${nonce}`.slice(0, 20),
    simNumber: `99${String(hash % 100_000_000).padStart(8, "0")}`.slice(0, 15),
    imsiNumber: uniqueFifteenDigitId(`imsi-${identitySeed}`),
    meterMobile: `9${String((hash % 1_000_000_000) + 100_000_000).slice(0, 9)}`,
    ipAddress: `10.${20 + (hash % 30)}.${10 + ((hash >>> 8) % 200)}.${10 + ((hash >>> 16) % 200)}`,
    modemSerial: `MOD${nonce}`.slice(0, 20),
    modemImei: uniqueFifteenDigitId(`imei-${identitySeed}`),
  };
}

function tenDigitMobile(seed: string): string {
  const hash = hashSeed(seed);
  return `98${String((hash % 100_000_000) + bulkConsumerRowSequence)
    .padStart(8, "0")
    .slice(-8)}`;
}

function mainSubMeterName(): string {
  return getMainSubMeterBulkValue();
}

/**
 * Manual UI Excel row (clipboard TSV) for bulk-upload-consumers.
 * Column order matches CONSUMER_BULK_UPLOAD_COLUMNS.
 */
export const MANUAL_UI_CONSUMER_BULK_SAMPLE: ConsumerBulkUploadRow = {
  Zone: "Hawabangla",
  "Consumer ID": "9921425001",
  "Consumer Name": "Consumer 1",
  "Father Name": "consumer 11",
  "Email ID": "",
  "Mobile No.": "8830100301",
  "Land Line No.": "12345",
  Address: "Hyderabad",
  "Pin Code": "543211",
  "Sub Station": "PragatiNagar",
  Feeder: "PARMANU NAGAR(CHQ)",
  DTR: "DTR0353232881441",
  "IVRS Number": "9921425001",
  "Account ID": "9921425001",
  "Nearest Acct. ID": "9921425000",
  "Total Demand (KVA)": 1,
  "Sanctioned Load (KW)": 2,
  "Sanctioned Load (HP)": "",
  "Connected KVA": "",
  "Connected KW": "",
  "Connected HP": "",
  "Rated KVA": "",
  "Rated KW": "",
  "Connection Type": "",
  "Billing Cycle": "Monthly",
  "Bill Day": 1,
  "Consumer Category": "SCH",
  "Nature Of Business": "",
  "Connection Status": "Connected",
  TOD: "NO TOD LT",
  "MR Code": "",
  "Main/Sub Meter": "Main",
  MSN: "23010551",
  "Service Point ID": "1234",
  "Date Of Service": "2026-07-27",
  "Meter Phase": "3PH 4CT",
  "Connected To DCU": "",
  "SIM No.": "12345678909871200",
  "IMSI No.": "123456789012345",
  "Mobile No. (Meter)": "5432167891",
  "IP Address": "123.14.5.67",
  "Modem Serial Number": "12345678998765400000",
  "Modem IMEI": "123456789098765",
  "Meter Initial Reading": 1,
  "Is Net Meter": "",
  "Activate/Deactivate Remarks": "",
};

/**
 * Build a row from the manual UI sample.
 * - exact:true → identical clipboard row (single-row probe)
 * - otherwise → sample hierarchy/lookups + unique CID/MSN/modem for multi-row
 */
export function buildManualUiConsumerBulkRow(options?: {
  label?: string;
  allocateMeter?: boolean;
  exact?: boolean;
}): ConsumerBulkUploadRow {
  const row: ConsumerBulkUploadRow = { ...MANUAL_UI_CONSUMER_BULK_SAMPLE };

  if (options?.exact) {
    // Exact clipboard probe: keep user values but uniquify CID so re-runs don't hit exists,
    // fill blank Connection Type, and shorten remarks-safe modem fields already in sample.
    const consumerId = uniqueConsumerId().slice(0, 20);
    row["Consumer ID"] = consumerId;
    row["IVRS Number"] = consumerId;
    row["Account ID"] = consumerId;
    if (!String(row["Connection Type"] ?? "").trim()) {
      row["Connection Type"] = getConnectionTypeBulkValue();
    }
    // Sample used invalid dropdown codes / unknown DTR / possibly mapped MSN.
    if (
      String(row["Consumer Category"] ?? "")
        .trim()
        .toUpperCase() === "SCH"
    ) {
      row["Consumer Category"] = getConsumerCategoryBulkValue();
    }
    if (String(row["Meter Phase"] ?? "").includes("4CT")) {
      row["Meter Phase"] = getMeterPhaseBulkValue();
    }
    if (String(row.DTR ?? "").startsWith("DTR035")) {
      row.DTR = dtrName();
    }
    row.MSN = nextBulkConsumerMeterSerial();
    row["Nearest Acct. ID"] = nearestAcctId() || row["Nearest Acct. ID"];
    const modem = uniqueModemIdentity(`exact-${consumerId}`);
    row["Service Point ID"] = modem.servicePointId;
    row["SIM No."] = modem.simNumber;
    row["IMSI No."] = modem.imsiNumber;
    row["Mobile No. (Meter)"] = modem.meterMobile;
    row["IP Address"] = modem.ipAddress;
    row["Modem Serial Number"] = modem.modemSerial;
    row["Modem IMEI"] = modem.modemImei;
    row["Activate/Deactivate Remarks"] = "Manual UI sample";
    return row;
  }

  bulkConsumerRowSequence += 1;
  const label = options?.label ?? `manual-${bulkConsumerRowSequence}`;
  const consumerId = uniqueConsumerId();
  const meterSerial = options?.allocateMeter
    ? nextBulkConsumerMeterSerial()
    : peekBulkConsumerMeterSerial();
  const modem = uniqueModemIdentity(`${label}-${meterSerial}-${Date.now()}`);

  row["Consumer ID"] = consumerId;
  row["Consumer Name"] = `Auto ${label}`.slice(0, 20);
  row["Email ID"] = `auto.${label.replace(/[^a-zA-Z0-9]/g, ".")}@example.com`.slice(0, 50);
  row["Mobile No."] = tenDigitMobile(`${label}-${consumerId}`);
  row["IVRS Number"] = consumerId;
  row["Account ID"] = consumerId;
  row.MSN = meterSerial;
  row["Service Point ID"] = modem.servicePointId;
  row["SIM No."] = modem.simNumber;
  row["IMSI No."] = modem.imsiNumber;
  row["Mobile No. (Meter)"] = modem.meterMobile;
  row["IP Address"] = modem.ipAddress;
  row["Modem Serial Number"] = modem.modemSerial;
  row["Modem IMEI"] = modem.modemImei;
  row["Date Of Service"] = isoToday();
  row["Activate/Deactivate Remarks"] = "Auto bulk sample";

  // Prefer known-good lookup labels when sample values are invalid codes.
  if (!String(row["Connection Type"] ?? "").trim()) {
    row["Connection Type"] = getConnectionTypeBulkValue();
  }
  if (
    String(row["Consumer Category"] ?? "")
      .trim()
      .toUpperCase() === "SCH"
  ) {
    row["Consumer Category"] = getConsumerCategoryBulkValue();
  }
  if (String(row["Meter Phase"] ?? "").includes("4CT")) {
    row["Meter Phase"] = getMeterPhaseBulkValue();
  }
  // Keep sample hierarchy names, but fall back to resolved DTR when sample DTR is unknown.
  if (String(row.DTR ?? "").startsWith("DTR035")) {
    row.DTR = dtrName();
  }
  row["Nearest Acct. ID"] = nearestAcctId() || row["Nearest Acct. ID"];

  return row;
}

export function buildManualUiConsumerBulkRows(
  count: number,
  options?: { labelPrefix?: string; allocateMeter?: boolean },
): ConsumerBulkUploadRow[] {
  const prefix = options?.labelPrefix ?? "manual";
  const allocateMeter = options?.allocateMeter !== false;
  return Array.from({ length: count }, (_, index) =>
    buildManualUiConsumerBulkRow({
      label: `${prefix}-${index + 1}`,
      allocateMeter,
    }),
  );
}

/** Build N unique valid consumer bulk rows (each allocates its own meter when requested). */
export function buildValidConsumerBulkRows(
  count: number,
  options?: {
    labelPrefix?: string;
    allocateMeter?: boolean;
  },
): ConsumerBulkUploadRow[] {
  const prefix = options?.labelPrefix ?? "row";
  const allocateMeter = options?.allocateMeter !== false;
  return Array.from({ length: count }, (_, index) =>
    buildValidConsumerBulkRow({
      label: `${prefix}-${index + 1}`,
      allocateMeter,
    }),
  );
}

export function buildValidConsumerBulkRow(options?: {
  meterSerial?: string;
  consumerId?: string;
  ivrsNumber?: string;
  accountId?: string;
  nearestAcctId?: string;
  label?: string;
  allocateMeter?: boolean;
}): ConsumerBulkUploadRow {
  const today = isoToday();
  const label = options?.label ?? uniqueSuffix();
  bulkConsumerRowSequence += 1;
  const stamp = `${label}${Date.now()}${bulkConsumerRowSequence}`;
  const consumerId = options?.consumerId ?? uniqueConsumerId();
  const meterSerial =
    options?.meterSerial ??
    (options?.allocateMeter ? nextBulkConsumerMeterSerial() : peekBulkConsumerMeterSerial());
  const modem = uniqueModemIdentity(`${label}-${meterSerial}-${stamp}`);

  return {
    Zone: zoneName(),
    "Consumer ID": consumerId,
    "Consumer Name": `Auto ${label}`.slice(0, 20),
    "Father Name": "Suresh Kumar",
    "Email ID": `auto.${label.replace(/[^a-zA-Z0-9]/g, ".")}@example.com`.slice(0, 50),
    "Mobile No.": tenDigitMobile(stamp),
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
    "Connection Type": getConnectionTypeBulkValue(),
    "Billing Cycle": getBillingCycleBulkValue(),
    "Bill Day": 5,
    "Consumer Category": getConsumerCategoryBulkValue(),
    "Nature Of Business": "Commercial",
    "Connection Status": getConnectionStatusBulkValue(),
    TOD: getTodBulkValue(),
    "MR Code": "MR01",
    "Main/Sub Meter": mainSubMeterName(),
    MSN: meterSerial,
    "Service Point ID": modem.servicePointId,
    "Date Of Service": today,
    "Meter Phase": getMeterPhaseBulkValue(),
    "Connected To DCU": true,
    "SIM No.": modem.simNumber,
    "IMSI No.": modem.imsiNumber,
    "Mobile No. (Meter)": modem.meterMobile,
    "IP Address": modem.ipAddress,
    "Modem Serial Number": modem.modemSerial,
    "Modem IMEI": modem.modemImei,
    "Meter Initial Reading": 1,
    "Is Net Meter": false,
    "Activate/Deactivate Remarks": "Auto bulk",
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
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

function xlsxUpload(
  buffer: Buffer,
  fileName = `consumer-bulk-${uniqueSuffix()}.xlsx`,
): BulkUploadFileInput {
  return {
    fileName,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
}

const hierarchyEnvKeys = [...CONSUMER_BULK_UPLOAD_HIERARCHY_ENV_KEYS];

export const bulkUploadConsumersTestCases: BulkUploadConsumersTestCase[] = [
  {
    testName: "Excel upload (consumers) — only an Excel .xlsx file is allowed",
    scenario: "file_invalid_type",
    expectedStatus: 400,
    buildUpload: async () => ({
      fileName: "consumers-invalid.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(`${CONSUMER_BULK_UPLOAD_COLUMNS.join(",")}\nCID1,Test`, "utf8"),
    }),
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — required Excel columns must be present",
    scenario: "file_missing_columns",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const columns = CONSUMER_BULK_UPLOAD_COLUMNS.filter((c) => c !== "Consumer ID");
      const buffer = await buildConsumerBulkUploadXlsx(
        [buildValidConsumerBulkRow({ label: "missing-col" })],
        { columns: [...columns] },
      );
      return xlsxUpload(buffer, "consumer-bulk-missing-columns.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — duplicate column names are rejected",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — the file must contain at least one data row",
    scenario: "file_no_data_rows",
    expectedStatus: 400,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx([]);
      return xlsxUpload(buffer, "consumer-bulk-header-only.xlsx");
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — zone must be a known value",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — consumer ID is required",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — the same consumer ID cannot appear twice in the file",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — a consumer ID that already exists is rejected",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — nearest account ID must be valid",
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
    tags: ["@master-data", "@bulk-upload-consumers", "@negative", "@backend-defect"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — nearest account ID is required",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — bill day cannot be greater than 28",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — bill day cannot be less than 1",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — consumer category must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — billing cycle must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — connection type must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — connection status must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — TOD must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — substation must belong to the selected zone",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — feeder must belong to the selected network",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — DTR must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — meter serial is required",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — meter serial must already exist",
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
    tags: ["@master-data", "@bulk-upload-consumers", "@negative", "@backend-defect"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — meter must be active",
    scenario: "row_meter_inactive",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        label: "msn-inactive",
        meterSerial: getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative", "@backend-defect"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — meter cannot already be assigned to another consumer",
    scenario: "row_meter_already_mapped",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({
        label: "msn-mapped",
        meterSerial: getValidateMeterSerial("VALIDATE_DTR_METER_ASSIGNED_SERIAL"),
      });
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative", "@backend-defect"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — main/sub meter type must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — meter phase must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — service point ID is required",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — initial reading must be greater than zero",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — SIM number is required",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — IMSI must contain digits only",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — meter mobile number must be 10 digits",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — IP address must be valid",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — modem serial is required",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — modem IMEI must be 15 digits",
    scenario: "row_invalid_imei",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const row = buildValidConsumerBulkRow({ label: "bad-imei" });
      row["Modem IMEI"] = "12345";
      const buffer = await buildConsumerBulkUploadXlsx([row]);
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@negative", "@backend-defect"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — duplicate MSN within file",
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
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — at least two consumers are created from the file",
    scenario: "bulk_success",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx(
        buildManualUiConsumerBulkRows(2, {
          labelPrefix: "success",
          allocateMeter: true,
        }),
      );
      return xlsxUpload(buffer);
    },
    tags: [
      "@smoke",
      "@master-data",
      "@bulk-upload-consumers",
      "@consumer",
      "@positive",
      "@backend-defect",
    ],
    nonEmptyExpected: true,
  },
  {
    testName: "Excel upload (consumers) — more than five consumers are created from the file",
    scenario: "bulk_success_multi",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx(
        buildManualUiConsumerBulkRows(6, {
          labelPrefix: "multi",
          allocateMeter: true,
        }),
      );
      return xlsxUpload(buffer);
    },
    tags: ["@master-data", "@bulk-upload-consumers", "@consumer", "@positive", "@backend-defect"],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — a full sample Excel row is accepted",
    scenario: "bulk_success_manual_sample",
    expectedStatus: 200,
    envKeys: hierarchyEnvKeys,
    buildUpload: async () => {
      const buffer = await buildConsumerBulkUploadXlsx([
        buildManualUiConsumerBulkRow({ exact: true }),
      ]);
      return xlsxUpload(buffer);
    },
    tags: [
      "@master-data",
      "@bulk-upload-consumers",
      "@consumer",
      "@positive",
      "@manual-ui-sample",
      "@backend-defect",
    ],
    nonEmptyExpected: false,
  },
  {
    testName: "Excel upload (consumers) — blank rows are ignored",
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
    tags: ["@master-data", "@bulk-upload-consumers", "@consumer", "@positive", "@backend-defect"],
    nonEmptyExpected: false,
  },
];
