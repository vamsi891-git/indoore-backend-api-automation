import type { APIRequestContext } from "@playwright/test";
import ExcelJS from "exceljs";
import { METER_REPLACEMENT_MAX_RESPONSE_TIME_MS } from "../utils/Meter replacement request.helper";
import { resolveMeterReplacementEnv } from "../utils/meter-replacement-env.helper";
import {
  ensureMeterReplacementBulkRuntimeContext,
  resolveAssignedNewMeterSerial,
  resolvePendingConsumerOldMeterSerial,
} from "../utils/meter-replacement-bulk-runtime.helper";
import type { BulkValidateMeterReplacementScenario } from "../Mapper/bulk-validation.mapper";

export const bulkValidateMeterReplacementMaxResponseTimeMs =
  METER_REPLACEMENT_MAX_RESPONSE_TIME_MS;

/**
 * Bulk validation expects the same worksheet layout used by the meter
 * replacement bulk upload flow rather than the ad-hoc column names we
 * inferred earlier. Keep this in sync with the endpoint template.
 */
export const METER_REPLACEMENT_BULK_COLUMNS = [
  "Sl No",
  "Old Meter Serial",
  "New Meter Serial",
  "Old Meter Reading",
  "New Meter Reading",
  "Replacement Reason",
  "Remarks",
  "Latitude",
  "Longitude",
] as const;

export const METER_REPLACEMENT_BULK_SHEET_NAME = "meter-replacement";

export interface BulkUploadFileInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export type MeterReplacementBulkRow = Partial<
  Record<(typeof METER_REPLACEMENT_BULK_COLUMNS)[number], string | number>
>;

export interface BuildMeterReplacementBulkOptions {
  columns?: string[];
  sheetName?: string;
  duplicateColumn?: string;
}

function uniqueSuffix(): string {
  return String(Date.now());
}

export function buildValidMeterReplacementBulkRow(
  overrides: MeterReplacementBulkRow = {},
): MeterReplacementBulkRow {
  return {
    "Sl No": 1,
    "Old Meter Serial": resolveMeterReplacementEnv(
      "METER_REPLACEMENT_OLD_METER_SERIAL",
    ),
    "Old Meter Reading": 1000,
    "New Meter Serial": resolveMeterReplacementEnv(
      "METER_REPLACEMENT_NEW_METER_SERIAL",
    ),
    "New Meter Reading": 0,
    "Replacement Reason": "Meter faulty — automated bulk validate test",
    Latitude: "22.7196",
    Longitude: "75.8577",
    Remarks: "Created by automation",
    ...overrides,
  };
}

export async function buildMeterReplacementBulkXlsx(
  dataRows: MeterReplacementBulkRow[],
  options: BuildMeterReplacementBulkOptions = {},
): Promise<Buffer> {
  const columns = options.columns ?? [...METER_REPLACEMENT_BULK_COLUMNS];
  const sheetName = options.sheetName ?? METER_REPLACEMENT_BULK_SHEET_NAME;
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
        const value = row[column as keyof MeterReplacementBulkRow];
        return value ?? "";
      }),
    );
    if (options.duplicateColumn) {
      const last = sheet.lastRow;
      if (last) {
        last.getCell(columns.length + 1).value =
          row[options.duplicateColumn as keyof MeterReplacementBulkRow] ?? "";
      }
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export interface BulkValidateMeterReplacementTestCase {
  testName: string;
  scenario: BulkValidateMeterReplacementScenario;
  expectedStatus: number;
  buildUpload: (
    authenticatedApi: APIRequestContext,
  ) => Promise<BulkUploadFileInput>;
  /** Skip when any listed env var is empty. */
  envKeys?: string[];
  tags: string[];
}

function xlsxUpload(
  buffer: Buffer,
  fileName = `meter-replacement-bulk-${uniqueSuffix()}.xlsx`,
): BulkUploadFileInput {
  return {
    fileName,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  };
}

async function buildRuntimeRow(
  authenticatedApi: APIRequestContext,
  overrides: MeterReplacementBulkRow = {},
): Promise<MeterReplacementBulkRow> {
  const runtime = await ensureMeterReplacementBulkRuntimeContext(
    authenticatedApi,
  );
  return buildValidMeterReplacementBulkRow({
    "Old Meter Serial": runtime.oldMeterSerial,
    "New Meter Serial": runtime.newMeterSerial,
    Latitude: String(runtime.latitude || "22.7196"),
    Longitude: String(runtime.longitude || "75.8577"),
    ...overrides,
  });
}

export const bulkValidateMeterReplacementTestCases: BulkValidateMeterReplacementTestCase[] =
  [
    // ─── File validation ──────────────────────────────────────────────────────
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — only .xlsx allowed",
      scenario: "file_invalid_type",
      expectedStatus: 400,
      buildUpload: async () => ({
        fileName: "meter-replacement-invalid.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(
          `${METER_REPLACEMENT_BULK_COLUMNS.join(",")}\nOLD-1,1000,NEW-1,0,Faulty,,22.7,75.8`,
          "utf8",
        ),
      }),
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — required columns must be present",
      scenario: "file_missing_columns",
      expectedStatus: 400,
      buildUpload: async () => {
        const columns = METER_REPLACEMENT_BULK_COLUMNS.filter(
          (c) => c !== "Old Meter Serial",
        );
        const buffer = await buildMeterReplacementBulkXlsx(
          [buildValidMeterReplacementBulkRow()],
          { columns: [...columns] },
        );
        return xlsxUpload(buffer, "meter-replacement-bulk-missing-columns.xlsx");
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — duplicate column names rejected",
      scenario: "file_duplicate_columns",
      // Live API currently accepts duplicate headers (200). Soft-assert in spec.
      expectedStatus: 200,
      buildUpload: async () => {
        const buffer = await buildMeterReplacementBulkXlsx(
          [buildValidMeterReplacementBulkRow()],
          { duplicateColumn: "Old Meter Serial" },
        );
        return xlsxUpload(
          buffer,
          "meter-replacement-bulk-duplicate-columns.xlsx",
        );
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — at least one data row required",
      scenario: "file_no_data_rows",
      expectedStatus: 400,
      buildUpload: async () => {
        const buffer = await buildMeterReplacementBulkXlsx([]);
        return xlsxUpload(buffer, "meter-replacement-bulk-header-only.xlsx");
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },

    // ─── Row-level: all valid ─────────────────────────────────────────────────
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — single valid row reports valid:true",
      scenario: "validate_all_valid",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi);
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@smoke", "@meter-replacement", "@bulk-validate"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — mixed valid/invalid rows reported per-row",
      scenario: "validate_mixed",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const valid = await buildRuntimeRow(authenticatedApi);
        const invalid = { ...valid, "Replacement Reason": "", "Sl No": 2 };
        return xlsxUpload(
          await buildMeterReplacementBulkXlsx([valid, invalid]),
        );
      },
      tags: ["@meter-replacement", "@bulk-validate"],
    },

    // ─── Row-level: old meter ─────────────────────────────────────────────────
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — old meter serial required",
      scenario: "row_missing_old_meter_serial",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "Old Meter Serial": "",
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — old meter serial must resolve to a consumer",
      scenario: "row_old_meter_not_found",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "Old Meter Serial": `NOT-FOUND-${uniqueSuffix()}`,
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — inactive old meter rejected",
      scenario: "row_old_meter_inactive",
      expectedStatus: 200,
      envKeys: ["METER_REPLACEMENT_INACTIVE_METER_SERIAL"],
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "Old Meter Serial": resolveMeterReplacementEnv(
            "METER_REPLACEMENT_INACTIVE_METER_SERIAL",
          ),
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },

    // ─── Row-level: new meter ─────────────────────────────────────────────────
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — new meter serial required",
      scenario: "row_missing_new_meter_serial",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "New Meter Serial": "",
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — new meter serial must exist",
      scenario: "row_new_meter_not_found",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "New Meter Serial": `NOT-FOUND-${uniqueSuffix()}`,
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — new meter must not already be assigned",
      scenario: "row_new_meter_already_assigned",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const runtime = await ensureMeterReplacementBulkRuntimeContext(
          authenticatedApi,
        );
        const assigned =
          (await resolveAssignedNewMeterSerial(
            authenticatedApi,
            runtime.oldMeterSerial,
          )) || runtime.oldMeterSerial;
        const row = buildValidMeterReplacementBulkRow({
          "Old Meter Serial": runtime.oldMeterSerial,
          "New Meter Serial": assigned,
          Latitude: String(runtime.latitude || "22.7196"),
          Longitude: String(runtime.longitude || "75.8577"),
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — old and new meter serial must differ",
      scenario: "row_old_new_same_serial",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const runtime = await ensureMeterReplacementBulkRuntimeContext(
          authenticatedApi,
        );
        const row = buildValidMeterReplacementBulkRow({
          "Old Meter Serial": runtime.oldMeterSerial,
          "New Meter Serial": runtime.oldMeterSerial,
          Latitude: String(runtime.latitude || "22.7196"),
          Longitude: String(runtime.longitude || "75.8577"),
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },

    // ─── Row-level: file-scoped duplicates ────────────────────────────────────
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — duplicate old meter serial within file",
      scenario: "row_duplicate_old_meter_serial_in_file",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi);
        const row2 = { ...row, "Sl No": 2 };
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row, row2]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — duplicate new meter serial within file",
      scenario: "row_duplicate_new_meter_serial_in_file",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const runtime = await ensureMeterReplacementBulkRuntimeContext(
          authenticatedApi,
        );
        const secondOld =
          (await resolveAssignedNewMeterSerial(
            authenticatedApi,
            runtime.oldMeterSerial,
          )) || `${runtime.oldMeterSerial}-2`;
        const rowA = buildValidMeterReplacementBulkRow({
          "Sl No": 1,
          "Old Meter Serial": runtime.oldMeterSerial,
          "New Meter Serial": runtime.newMeterSerial,
        });
        const rowB = buildValidMeterReplacementBulkRow({
          "Sl No": 2,
          "Old Meter Serial": secondOld,
          "New Meter Serial": runtime.newMeterSerial,
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([rowA, rowB]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },

    // ─── Row-level: business rules ────────────────────────────────────────────
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — consumer with existing PENDING replacement rejected",
      scenario: "row_consumer_has_pending_replacement",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const pendingOld = await resolvePendingConsumerOldMeterSerial(
          authenticatedApi,
        );
        if (!pendingOld) {
          throw new Error(
            "No PENDING consumer old-meter serial available. Set METER_REPLACEMENT_PENDING_CONSUMER_OLD_SERIAL or ensure ineligibleConsumerId has a pending replacement.",
          );
        }
        const runtime = await ensureMeterReplacementBulkRuntimeContext(
          authenticatedApi,
        );
        const row = buildValidMeterReplacementBulkRow({
          "Old Meter Serial": pendingOld,
          "New Meter Serial": runtime.newMeterSerial,
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — replacement reason required",
      scenario: "row_missing_replacement_reason",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "Replacement Reason": "",
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — old meter reading must be numeric",
      scenario: "row_invalid_old_meter_reading",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "Old Meter Reading": "not-a-number",
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — new meter reading must be numeric",
      scenario: "row_invalid_new_meter_reading",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "New Meter Reading": "not-a-number",
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — meter readings must be non-negative",
      scenario: "row_negative_reading",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          "Old Meter Reading": -5,
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — latitude must be a valid coordinate",
      scenario: "row_invalid_latitude",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          Latitude: "999",
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
    {
      testName:
        "Validate POST /indore/meter-replacement/bulk/validate — longitude must be a valid coordinate",
      scenario: "row_invalid_longitude",
      expectedStatus: 200,
      buildUpload: async (authenticatedApi) => {
        const row = await buildRuntimeRow(authenticatedApi, {
          Longitude: "999",
        });
        return xlsxUpload(await buildMeterReplacementBulkXlsx([row]));
      },
      tags: ["@meter-replacement", "@bulk-validate", "@negative"],
    },
  ];
