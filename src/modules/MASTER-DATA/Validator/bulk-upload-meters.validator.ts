import { expect } from "@playwright/test";
import {
  BulkUploadMetersData,
  BulkUploadMetersMapped,
  BulkUploadMetersScenario,
  BulkUploadMeterRowResult,
} from "../Mapper/bulk-upload-meters.mapper";

const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_FILE_TYPE",
  "INVALID_TEMPLATE",
  "BAD_REQUEST",
] as const;

const ROW_FAILURE_STATUSES = ["FAILED", "VALIDATION_FAILED"] as const;

function rowMessages(row: BulkUploadMeterRowResult | undefined): string {
  if (!row) {
    return "";
  }
  return `${row.message ?? ""} ${(row.messages ?? []).join(" ")}`.toLowerCase();
}

function firstFailedRow(data: BulkUploadMetersData): BulkUploadMeterRowResult | undefined {
  return data.rowResults.find((row) =>
    ROW_FAILURE_STATUSES.includes(
      row.status as (typeof ROW_FAILURE_STATUSES)[number],
    ),
  );
}

export class BulkUploadMetersValidator {
  validateResponse(mapped: BulkUploadMetersMapped): void {
    expect(mapped).toBeDefined();
  }

  validateUploadSuccess(mapped: BulkUploadMetersMapped): void {
    expect(mapped.isUploadSuccess).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateRootStructure(data: BulkUploadMetersData): void {
    expect(data.fileName).toBeTruthy();
    expect(typeof data.totalRows).toBe("number");
    expect(typeof data.createdCount).toBe("number");
    expect(typeof data.failedCount).toBe("number");
    expect(typeof data.validationFailedCount).toBe("number");
    expect(typeof data.batchesProcessed).toBe("number");
    expect(typeof data.batchSize).toBe("number");
    expect(Array.isArray(data.rowResults)).toBeTruthy();
  }

  validateCountsConsistency(data: BulkUploadMetersData): void {
    expect(data.totalRows).toBeGreaterThanOrEqual(0);
    expect(data.createdCount).toBeGreaterThanOrEqual(0);
    expect(data.failedCount).toBeGreaterThanOrEqual(0);
    expect(data.validationFailedCount).toBeGreaterThanOrEqual(0);
    expect(data.batchesProcessed).toBeGreaterThanOrEqual(0);
    expect(data.batchSize).toBeGreaterThan(0);
    expect(data.rowResults.length).toBeGreaterThanOrEqual(data.totalRows);
  }

  validateRowResultsStructure(rows: BulkUploadMeterRowResult[]): void {
    rows.forEach((row) => {
      expect(row.rowNumber).toBeGreaterThan(1);
      expect(typeof row.meterSerialNumber).toBe("string");
      expect(row.status).toBeTruthy();
      if (row.status === "CREATED") {
        expect(row.meterTblRefId).toBeGreaterThan(0);
        expect(row.meterLookupTblRefId).toBeGreaterThan(0);
      }
      if (row.messages?.length) {
        row.messages.forEach((msg) => expect(msg.trim().length).toBeGreaterThan(0));
      }
    });
  }

  validateCreatedRows(rows: BulkUploadMeterRowResult[], expectedCount: number): void {
    const created = rows.filter((row) => row.status === "CREATED");
    expect(created.length).toBe(expectedCount);
    created.forEach((row) => {
      expect(row.meterSerialNumber.trim().length).toBeGreaterThan(0);
      expect(row.meterTblRefId).toBeGreaterThan(0);
      expect(row.meterLookupTblRefId).toBeGreaterThan(0);
    });
  }

  /**
   * Strict rejection — fails if the API accepts any invalid row (manual doc).
   */
  validateRejectedUpload(mapped: BulkUploadMetersMapped): void {
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
    expect(data.validationFailedCount + data.failedCount).toBeGreaterThan(0);

    failedRows.forEach((row) => {
      const hasMessage =
        (row.message?.trim().length ?? 0) > 0 ||
        (row.messages?.length ?? 0) > 0;
      expect(hasMessage).toBeTruthy();
    });
  }

  validateRowMessageMatches(
    mapped: BulkUploadMetersMapped,
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

  validateErrorStructure(mapped: BulkUploadMetersMapped): void {
    expect(mapped.success).toBeFalsy();
    expect(mapped.error).not.toBeNull();
    expect(mapped.error!.code).toBeTruthy();
    expect(mapped.error!.message).toBeTruthy();
  }

  validateKnownErrorCode(mapped: BulkUploadMetersMapped): void {
    if (!mapped.error?.code) {
      return;
    }
    expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
  }

  validateBulkSuccess(mapped: BulkUploadMetersMapped, expectedCreated: number): void {
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

  validateBulkSuccessBlankRow(mapped: BulkUploadMetersMapped): void {
    this.validateBulkSuccess(mapped, 1);
  }

  validateFileError(mapped: BulkUploadMetersMapped): void {
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
        "File-level validation must not create meters",
      ).toBe(0);
    }
  }

  validateRowAlreadyExists(mapped: BulkUploadMetersMapped): void {
    this.validateRowMessageMatches(
      mapped,
      /exist|already/,
      "meter already exists",
    );
  }

  validateScenario(mapped: BulkUploadMetersMapped, scenario: BulkUploadMetersScenario): void {
    switch (scenario) {
      case "bulk_success":
        this.validateBulkSuccess(mapped, 1);
        break;
      case "bulk_success_multi":
        this.validateBulkSuccess(mapped, 2);
        break;
      case "bulk_success_blank_row":
        this.validateBulkSuccessBlankRow(mapped);
        break;
      case "file_invalid_type":
      case "file_missing_columns":
      case "file_no_data_rows":
      case "file_duplicate_columns":
      case "file_manufacturer_invalid":
        this.validateFileError(mapped);
        break;
      case "row_missing_serial":
        this.validateRowMessageMatches(
          mapped,
          /serial|required|mandatory|blank/,
          "meter serial required",
        );
        break;
      case "row_duplicate_serial":
        this.validateRowMessageMatches(
          mapped,
          /duplicate/,
          "duplicate serial within file",
        );
        break;
      case "row_asset_mismatch":
        this.validateRowMessageMatches(
          mapped,
          /asset|rapdrp|match|blank/,
          "asset and RAPDRP must match serial or be blank",
        );
        break;
      case "row_already_exists":
        this.validateRowAlreadyExists(mapped);
        break;
      case "row_invalid_dlms":
        this.validateRowMessageMatches(
          mapped,
          /dlms|non.?dlms|invalid/,
          "invalid DLMS value",
        );
        break;
      case "row_invalid_model":
        this.validateRowMessageMatches(
          mapped,
          /model|manufacturer|invalid|not found|exist/,
          "meter model must exist when provided",
        );
        break;
      case "row_invalid_meter_status":
        this.validateRowMessageMatches(
          mapped,
          /status|connect|disconnect/,
          "meter status must be Connect or Disconnect",
        );
        break;
      case "row_mf_zero":
        this.validateRowMessageMatches(
          mapped,
          /mf|greater|zero|positive/,
          "MF must be greater than zero",
        );
        break;
      case "row_display_digit_zero":
      case "row_display_digit_mismatch":
        this.validateRowMessageMatches(
          mapped,
          /display|digit|length|positive/,
          "display digit validation",
        );
        break;
      case "row_negative_mptr":
      case "row_invalid_mctr":
      case "row_invalid_lptr":
      case "row_invalid_lctr":
        this.validateRowMessageMatches(
          mapped,
          /mptr|mctr|lptr|lctr|integer|negative|valid/,
          "meter configuration integers",
        );
        break;
      case "row_future_date":
        this.validateRowMessageMatches(
          mapped,
          /future|po date|testing date/i,
          "future meter dates not allowed",
        );
        break;
      case "row_invalid_po_date":
      case "row_invalid_testing_date":
        this.validateRowMessageMatches(
          mapped,
          /date|yyyy|valid|calendar|po|testing/,
          "meter date validation",
        );
        break;
      case "row_testing_before_po":
        this.validateRowMessageMatches(
          mapped,
          /testing|po|date|before|greater|equal|order/,
          "testing date must be on or after PO date",
        );
        break;
      case "row_accuracy_too_long":
        this.validateRowMessageMatches(
          mapped,
          /accuracy|class|length|character|8/,
          "accuracy class max 8 characters",
        );
        break;
      case "row_po_number_too_long":
        this.validateRowMessageMatches(
          mapped,
          /po number|length|character|32/,
          "PO number max 32 characters",
        );
        break;
      case "row_version_too_long":
        this.validateRowMessageMatches(
          mapped,
          /version|length|character|32/,
          "meter version max 32 characters",
        );
        break;
      case "row_rating_too_long":
        this.validateRowMessageMatches(
          mapped,
          /rating|length|character|15/,
          "meter rating max 15 characters",
        );
        break;
    }
  }
}
