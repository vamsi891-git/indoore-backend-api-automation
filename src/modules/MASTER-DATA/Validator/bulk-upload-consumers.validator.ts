import { expect } from "@playwright/test";
import {
  BulkUploadConsumersData,
  BulkUploadConsumersMapped,
  BulkUploadConsumersRowResult,
  BulkUploadConsumersScenario,
} from "../Mapper/bulk-upload-consumers.mapper";

const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_FILE_TYPE",
  "INVALID_TEMPLATE",
  "BAD_REQUEST",
] as const;

const ROW_FAILURE_STATUSES = ["FAILED", "VALIDATION_FAILED"] as const;

function rowMessages(row: BulkUploadConsumersRowResult | undefined): string {
  if (!row) {
    return "";
  }
  return `${row.message ?? ""} ${(row.messages ?? []).join(" ")}`.toLowerCase();
}

function firstFailedRow(
  data: BulkUploadConsumersData,
): BulkUploadConsumersRowResult | undefined {
  return data.rowResults.find((row) =>
    ROW_FAILURE_STATUSES.includes(
      row.status as (typeof ROW_FAILURE_STATUSES)[number],
    ),
  );
}

export class BulkUploadConsumersValidator {
  validateResponse(mapped: BulkUploadConsumersMapped): void {
    expect(mapped).toBeDefined();
  }

  validateUploadSuccess(mapped: BulkUploadConsumersMapped): void {
    expect(mapped.isUploadSuccess).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateRootStructure(data: BulkUploadConsumersData): void {
    expect(data.fileName).toBeTruthy();
    expect(typeof data.totalRows).toBe("number");
    expect(typeof data.createdCount).toBe("number");
    expect(typeof data.failedCount).toBe("number");
    if (data.validationFailedCount != null) {
      expect(typeof data.validationFailedCount).toBe("number");
    }
    expect(Array.isArray(data.rowResults)).toBeTruthy();
  }

  validateCountsConsistency(data: BulkUploadConsumersData): void {
    expect(data.totalRows).toBeGreaterThanOrEqual(0);
    expect(data.createdCount).toBeGreaterThanOrEqual(0);
    expect(data.failedCount).toBeGreaterThanOrEqual(0);
    if (data.validationFailedCount != null) {
      expect(data.validationFailedCount).toBeGreaterThanOrEqual(0);
    }
    expect(data.rowResults.length).toBeGreaterThanOrEqual(data.totalRows);
  }

  validateRowResultsStructure(rows: BulkUploadConsumersRowResult[]): void {
    rows.forEach((row) => {
      expect(row.rowNumber).toBeGreaterThan(1);
      expect(typeof row.consumerId).toBe("string");
      expect(typeof row.ivrsNumber).toBe("string");
      expect(typeof row.accountId).toBe("string");
      expect(typeof row.msn).toBe("string");
      expect(row.status).toBeTruthy();
      if (row.messages?.length) {
        row.messages.forEach((msg) =>
          expect(msg.trim().length).toBeGreaterThan(0),
        );
      }
    });
  }

  validateCreatedRows(rows: BulkUploadConsumersRowResult[],expectedCount: number,): void {
    const created = rows.filter((row) => row.status === "CREATED");
    expect(created.length).toBe(expectedCount);
    created.forEach((row) => {
      expect(row.consumerId.trim().length).toBeGreaterThan(0);
      expect(row.msn.trim().length).toBeGreaterThan(0);
    });
  }
  validateRejectedUpload(mapped: BulkUploadConsumersMapped): void {
    expect(mapped.success,"Backend must reject invalid bulk upload rows (success must be false)",).toBe(false);
    expect(mapped.data,"Expected data.rowResults for rejected bulk upload",).not.toBeNull();
    const data = mapped.data!;
    this.validateRootStructure(data);
    this.validateCountsConsistency(data);
    this.validateRowResultsStructure(data.rowResults);
    const createdRows = data.rowResults.filter((row) => row.status === "CREATED");
    expect(createdRows,"Backend accepted invalid bulk upload row(s); manual validations require rejection",).toHaveLength(0);
    expect(data.createdCount,"createdCount must be 0 when bulk upload validation rules are violated",).toBe(0);
    const failedRows = data.rowResults.filter((row) =>
      ROW_FAILURE_STATUSES.includes(row.status as (typeof ROW_FAILURE_STATUSES)[number],),
    );
    expect(failedRows.length,"At least one row must be VALIDATION_FAILED or FAILED",).toBeGreaterThanOrEqual(1);
    const validationFailedCount =
      data.validationFailedCount ??
      failedRows.filter((row) => row.status === "VALIDATION_FAILED").length;
    const failedCount =
      data.failedCount ??
      failedRows.filter((row) => row.status === "FAILED").length;
    expect(validationFailedCount + failedCount).toBeGreaterThan(0);
    failedRows.forEach((row) => {
      const hasMessage =
        (row.message?.trim().length ?? 0) > 0 ||
        (row.messages?.length ?? 0) > 0;
      expect(hasMessage).toBeTruthy();
    });
  }

  validateRowMessageMatches(mapped: BulkUploadConsumersMapped,pattern: RegExp,ruleDescription: string,): void {
    this.validateRejectedUpload(mapped);
    const row = firstFailedRow(mapped.data!);
    expect(rowMessages(row),`Expected row error mentioning: ${ruleDescription}`,).toMatch(pattern);
  }
  validateKnownErrorCode(mapped: BulkUploadConsumersMapped): void {
    if (!mapped.error?.code) {
      return;
    }
    expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
  }

  validateBulkSuccess(mapped: BulkUploadConsumersMapped,expectedCreated: number,): void {
    this.validateUploadSuccess(mapped);
    const data = mapped.data!;
    this.validateRootStructure(data);
    this.validateCountsConsistency(data);
    this.validateRowResultsStructure(data.rowResults);
    expect(data.createdCount).toBe(expectedCreated);
    this.validateCreatedRows(data.rowResults, expectedCreated);
    expect(data.failedCount).toBe(0);
    expect(data.validationFailedCount ?? 0).toBe(0);
  }
  validateFileError(mapped: BulkUploadConsumersMapped): void {
    expect(mapped.success).toBeFalsy();
    const hasFailureDetail =
      mapped.error != null || (mapped.message?.trim().length ?? 0) > 0;
    expect(hasFailureDetail).toBeTruthy();
    if (mapped.error) {
      expect(mapped.error.code).toBeTruthy();
      expect(mapped.error.message).toBeTruthy();
      this.validateKnownErrorCode(mapped);
    } else {
      expect(mapped.message?.trim().length).toBeGreaterThan(0);
    }
    if (mapped.data) {
      expect(
        mapped.data.createdCount,
        "File-level validation must not create consumers",
      ).toBe(0);
    }
  }

  validateScenario(mapped: BulkUploadConsumersMapped,scenario: BulkUploadConsumersScenario,): void {
    switch (scenario) {
      case "bulk_success":
        this.validateBulkSuccess(mapped, 1);
        break;
      case "bulk_success_multi":
        this.validateBulkSuccess(mapped, 2);
        break;
      case "bulk_success_blank_row":
        this.validateBulkSuccess(mapped, 1);
        break;
      case "file_invalid_type":
      case "file_missing_columns":
      case "file_no_data_rows":
      case "file_duplicate_columns":
      case "file_invalid_zone":
        this.validateFileError(mapped);
        break;
      case "row_missing_consumer_id":
        this.validateRowMessageMatches(
          mapped,
          /consumer id|required|mandatory|blank/,
          "Consumer ID required",
        );
        break;
      case "row_duplicate_consumer_id":
        this.validateRowMessageMatches(
          mapped,
          /duplicate|unique/,
          "duplicate Consumer ID within file",
        );
        break;
      case "row_consumer_id_exists":
        this.validateRowMessageMatches(
          mapped,
          /exist|already|unique|duplicate/,
          "Consumer ID already exists",
        );
        break;
      case "row_invalid_nearest_acct_id":
        this.validateRowMessageMatches(
          mapped,
          /nearest|account|valid|exist|not found/,
          "Nearest Account ID must be valid",
        );
        break;
      case "row_missing_nearest_acct_id":
        this.validateRowMessageMatches(
          mapped,
          /nearest|account|required|mandatory|blank/,
          "Nearest Account ID required",
        );
        break;
      case "row_invalid_bill_day":
      case "row_invalid_bill_day_zero":
        this.validateRowMessageMatches(
          mapped,
          /bill day|between|1|28|valid/,
          "Bill Day must be between 1 and 28",
        );
        break;
      case "row_invalid_consumer_category":
        this.validateRowMessageMatches(
          mapped,
          /category|valid|consumer/,
          "Consumer Category must be valid",
        );
        break;
      case "row_invalid_billing_cycle":
        this.validateRowMessageMatches(
          mapped,
          /billing cycle|valid/,
          "Billing Cycle must be valid",
        );
        break;
      case "row_invalid_connection_type":
        this.validateRowMessageMatches(
          mapped,
          /connection type|valid/,
          "Connection Type must be valid",
        );
        break;
      case "row_invalid_connection_status":
        this.validateRowMessageMatches(
          mapped,
          /connection status|status|valid/,
          "Connection Status must be valid",
        );
        break;
      case "row_invalid_tod":
        this.validateRowMessageMatches(
          mapped,
          /tod|time of day|valid/,
          "TOD must be valid",
        );
        break;
      case "row_invalid_substation":
        this.validateRowMessageMatches(
          mapped,
          /sub station|zone|feeder|hierarchy|exist|belong/,
          "network hierarchy validation",
        );
        break;
      case "row_invalid_feeder":
        this.validateRowMessageMatches(
          mapped,
          /feeder|sub station|zone|hierarchy|exist|belong/,
          "Feeder hierarchy validation",
        );
        break;
      case "row_invalid_dtr":
        this.validateRowMessageMatches(
          mapped,
          /dtr|feeder|network|exist|valid/,
          "DTR must be valid",
        );
        break;
      case "row_missing_msn":
        this.validateRowMessageMatches(
          mapped,
          /msn|meter|serial|required|mandatory|blank/,
          "MSN required",
        );
        break;
      case "row_meter_not_found":
        this.validateRowMessageMatches(
          mapped,
          /meter|exist|not found|invalid|msn/,
          "meter must exist",
        );
        break;
      case "row_meter_inactive":
        this.validateRowMessageMatches(
          mapped,
          /inactive|active|meter/,
          "meter must be active",
        );
        break;
      case "row_meter_already_mapped":
        this.validateRowMessageMatches(
          mapped,
          /mapped|assigned|already|consumer/,
          "meter must not already be mapped",
        );
        break;
      case "row_invalid_main_sub_meter":
        this.validateRowMessageMatches(
          mapped,
          /main|sub|meter|valid/,
          "Main/Sub Meter must be valid",
        );
        break;
      case "row_invalid_meter_phase":
        this.validateRowMessageMatches(
          mapped,
          /phase|valid/,
          "Meter Phase must be valid",
        );
        break;
      case "row_missing_service_point":
        this.validateRowMessageMatches(
          mapped,
          /service point|required|mandatory|blank/,
          "Service Point ID required",
        );
        break;
      case "row_reading_zero":
        this.validateRowMessageMatches(
          mapped,
          /reading|greater|zero|positive|initial/,
          "Meter Initial Reading must be greater than zero",
        );
        break;
      case "row_missing_sim":
        this.validateRowMessageMatches(
          mapped,
          /sim|required|mandatory|blank/,
          "SIM Number required",
        );
        break;
      case "row_invalid_imsi":
        this.validateRowMessageMatches(
          mapped,
          /imsi|digit|numeric|valid/,
          "IMSI must contain digits only",
        );
        break;
      case "row_invalid_meter_mobile":
        this.validateRowMessageMatches(
          mapped,
          /mobile|digit|10|valid/,
          "Meter Mobile Number must contain 10 digits",
        );
        break;
      case "row_invalid_ip":
        this.validateRowMessageMatches(
          mapped,
          /ip|address|valid|ipv4/,
          "IP Address must be valid",
        );
        break;
      case "row_missing_modem_serial":
        this.validateRowMessageMatches(
          mapped,
          /modem|serial|required|mandatory|blank/,
          "Modem Serial Number required",
        );
        break;
      case "row_invalid_imei":
        this.validateRowMessageMatches(
          mapped,
          /imei|digit|15|valid/,
          "Modem IMEI must be 15 digits",
        );
        break;
      case "row_duplicate_msn":
        this.validateRowMessageMatches(
          mapped,
          /duplicate|unique|msn|meter/,
          "duplicate MSN within file",
        );
        break;
    }
  }
}
