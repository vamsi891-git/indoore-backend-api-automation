import { expect } from "@playwright/test";
import {
  BulkUploadDtrData,
  BulkUploadDtrMapped,
  BulkUploadDtrRowResult,
  BulkUploadDtrScenario,
} from "../Mapper/bulk-upload-dtr.mapper";

const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_FILE_TYPE",
  "INVALID_TEMPLATE",
  "BAD_REQUEST",
] as const;

const ROW_FAILURE_STATUSES = ["FAILED", "VALIDATION_FAILED"] as const;

function rowMessages(row: BulkUploadDtrRowResult | undefined): string {
  if (!row) {
    return "";
  }
  return `${row.message ?? ""} ${(row.messages ?? []).join(" ")}`.toLowerCase();
}

function firstFailedRow(data: BulkUploadDtrData): BulkUploadDtrRowResult | undefined {
  return data.rowResults.find((row) =>
    ROW_FAILURE_STATUSES.includes(
      row.status as (typeof ROW_FAILURE_STATUSES)[number],
    ),
  );
}

export class BulkUploadDtrValidator {
  validateResponse(mapped: BulkUploadDtrMapped): void {
    expect(mapped).toBeDefined();
  }

  validateUploadSuccess(mapped: BulkUploadDtrMapped): void {
    expect(mapped.isUploadSuccess).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateRootStructure(data: BulkUploadDtrData): void {
    expect(data.fileName).toBeTruthy();
    expect(typeof data.totalRows).toBe("number");
    expect(typeof data.createdCount).toBe("number");
    expect(typeof data.failedCount).toBe("number");
    if (data.validationFailedCount != null) {
      expect(typeof data.validationFailedCount).toBe("number");
    }
    if (data.alreadyExistsCount != null) {
      expect(typeof data.alreadyExistsCount).toBe("number");
    }
    if (data.batchesProcessed != null) {
      expect(typeof data.batchesProcessed).toBe("number");
    }
    if (data.batchSize != null) {
      expect(typeof data.batchSize).toBe("number");
    }
    expect(Array.isArray(data.rowResults)).toBeTruthy();
  }

  validateCountsConsistency(data: BulkUploadDtrData): void {
    expect(data.totalRows).toBeGreaterThanOrEqual(0);
    expect(data.createdCount).toBeGreaterThanOrEqual(0);
    expect(data.failedCount).toBeGreaterThanOrEqual(0);
    if (data.validationFailedCount != null) {
      expect(data.validationFailedCount).toBeGreaterThanOrEqual(0);
    }
    if (data.alreadyExistsCount != null) {
      expect(data.alreadyExistsCount).toBeGreaterThanOrEqual(0);
    }
    if (data.batchesProcessed != null) {
      expect(data.batchesProcessed).toBeGreaterThanOrEqual(0);
    }
    if (data.batchSize != null) {
      expect(data.batchSize).toBeGreaterThan(0);
    }
    expect(data.rowResults.length).toBeGreaterThanOrEqual(data.totalRows);
  }

  validateRowResultsStructure(rows: BulkUploadDtrRowResult[]): void {
    rows.forEach((row) => {
      expect(row.rowNumber).toBeGreaterThan(1);
      expect(typeof row.dtrCode).toBe("string");
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(row.status).toBeTruthy();
      if (row.status === "CREATED") {
        expect(row.networkLookupId).toBeGreaterThan(0);
        expect(row.meterLookupId).toBeGreaterThan(0);
      }
      if (row.messages?.length) {
        row.messages.forEach((msg) => expect(msg.trim().length).toBeGreaterThan(0));
      }
    });
  }

  validateCreatedRows(rows: BulkUploadDtrRowResult[], expectedCount: number): void {
    const created = rows.filter((row) => row.status === "CREATED");
    expect(created.length).toBe(expectedCount);
    created.forEach((row) => {
      expect(row.dtrCode.trim().length).toBeGreaterThan(0);
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
      expect(row.networkLookupId).toBeGreaterThan(0);
      expect(row.meterLookupId).toBeGreaterThan(0);
    });
  }

  validateRejectedUpload(mapped: BulkUploadDtrMapped): void {
    expect(
      mapped.success,
      "Backend must reject invalid bulk upload rows (success must be false)",
    ).toBe(false);
    expect(
      mapped.data,
      "Expected data.rowResults for rejected bulk upload",
    ).not.toBeNull();

    const data = mapped.data!;
    this.validateRootStructure(data);
    this.validateCountsConsistency(data);
    this.validateRowResultsStructure(data.rowResults);

    const createdRows = data.rowResults.filter((row) => row.status === "CREATED");
    expect(
      createdRows,
      "Backend accepted invalid bulk upload row(s); manual validations require rejection",
    ).toHaveLength(0);
    expect(
      data.createdCount,
      "createdCount must be 0 when bulk upload validation rules are violated",
    ).toBe(0);

    const failedRows = data.rowResults.filter((row) =>
      ROW_FAILURE_STATUSES.includes(
        row.status as (typeof ROW_FAILURE_STATUSES)[number],
      ),
    );
    expect(
      failedRows.length,
      "At least one row must be VALIDATION_FAILED or FAILED",
    ).toBeGreaterThanOrEqual(1);
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

  validateRowMessageMatches(
    mapped: BulkUploadDtrMapped,
    pattern: RegExp,
    ruleDescription: string,
  ): void {
    this.validateRejectedUpload(mapped);
    const row = firstFailedRow(mapped.data!);
    expect(
      rowMessages(row),
      `Expected row error mentioning: ${ruleDescription}`,
    ).toMatch(pattern);
  }

  validateErrorStructure(mapped: BulkUploadDtrMapped): void {
    expect(mapped.success).toBeFalsy();
    expect(mapped.error).not.toBeNull();
    expect(mapped.error!.code).toBeTruthy();
    expect(mapped.error!.message).toBeTruthy();
  }

  validateKnownErrorCode(mapped: BulkUploadDtrMapped): void {
    if (!mapped.error?.code) {
      return;
    }
    expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
  }

  validateBulkSuccess(mapped: BulkUploadDtrMapped, expectedCreated: number): void {
    this.validateUploadSuccess(mapped);
    const data = mapped.data!;
    this.validateRootStructure(data);
    this.validateCountsConsistency(data);
    this.validateRowResultsStructure(data.rowResults);
    expect(data.createdCount).toBe(expectedCreated);
    this.validateCreatedRows(data.rowResults, expectedCreated);
    expect(data.failedCount).toBe(0);
    expect(data.validationFailedCount).toBe(0);
  }

  validateFileError(mapped: BulkUploadDtrMapped): void {
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
        "File-level validation must not create DTRs",
      ).toBe(0);
    }
  }

  validateScenario(mapped: BulkUploadDtrMapped, scenario: BulkUploadDtrScenario): void {
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
      case "row_missing_dtr_code":
        this.validateRowMessageMatches(
          mapped,
          /dtr code|required|mandatory|blank/,
          "DTR Code required",
        );
        break;
      case "row_missing_dtr_name":
        this.validateRowMessageMatches(
          mapped,
          /dtr name|required|mandatory|blank/,
          "DTR Name required",
        );
        break;
      case "row_duplicate_dtr_code":
        this.validateRowMessageMatches(
          mapped,
          /duplicate/,
          "duplicate DTR Code within file",
        );
        break;
      case "row_dtr_code_exists":
        this.validateRowMessageMatches(
          mapped,
          /exist|already|unique|duplicate/,
          "DTR Code already exists",
        );
        break;
      case "row_capacity_zero":
        this.validateRowMessageMatches(
          mapped,
          /capacity|greater|zero|positive/,
          "DTR Capacity must be greater than zero",
        );
        break;
      case "row_invalid_status":
        this.validateRowMessageMatches(
          mapped,
          /status|valid|active/,
          "Status must be valid",
        );
        break;
      case "row_invalid_substation":
        this.validateRowMessageMatches(
          mapped,
          /sub station|zone|feeder|hierarchy|exist|belong/,
          "network hierarchy validation",
        );
        break;
      case "row_missing_meter_serial":
        this.validateRowMessageMatches(
          mapped,
          /meter|serial|required|mandatory|blank/,
          "Meter Serial Number required",
        );
        break;
      case "row_meter_not_found":
        this.validateRowMessageMatches(
          mapped,
          /meter|exist|not found|invalid/,
          "meter must exist",
        );
        break;
      case "row_meter_inactive":
        this.validateRowMessageMatches(
          mapped,
          /inactive|active|meter_inactive/,
          "meter must be active",
        );
        break;
      case "row_meter_on_dtr":
        this.validateRowMessageMatches(
          mapped,
          /dtr|mapped|already|on/,
          "meter already on DTR",
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
      case "row_invalid_service_date":
        this.validateRowMessageMatches(
          mapped,
          /service date|date|yyyy|valid|format/,
          "Service Date must be valid",
        );
        break;
      case "row_future_service_date":
      case "row_future_entry_date":
        this.validateRowMessageMatches(
          mapped,
          /date|future|valid|service|entry/,
          "future dates not allowed",
        );
        break;
      case "row_reading_zero":
        this.validateRowMessageMatches(
          mapped,
          /reading|greater|zero|positive|initial/,
          "Meter Initial Reading must be greater than zero",
        );
        break;
    }
  }
}
