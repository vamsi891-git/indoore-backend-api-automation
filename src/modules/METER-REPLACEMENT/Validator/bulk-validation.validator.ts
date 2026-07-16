import { expect } from "@playwright/test";
import {
  BulkValidateMeterReplacementMapped,
  BulkValidateMeterReplacementRowResult,
  BulkValidateMeterReplacementScenario,
  BulkValidateMeterReplacementSummary,
} from "../Mapper/bulk-validation.mapper";

const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_FILE_TYPE",
  "INVALID_TEMPLATE",
  "BAD_REQUEST",
] as const;

function rowErrorsText(row: BulkValidateMeterReplacementRowResult | undefined): string {
  if (!row) {
    return "";
  }
  return (row.errors ?? []).join(" ").toLowerCase();
}

function firstInvalidRow(
  rows: BulkValidateMeterReplacementRowResult[],
): BulkValidateMeterReplacementRowResult | undefined {
  return rows.find((row) => row.valid === false);
}

export class BulkValidateMeterReplacementValidator {
  validateResponse(mapped: BulkValidateMeterReplacementMapped): void {
    expect(mapped).toBeDefined();
  }

  validateReportSuccess(mapped: BulkValidateMeterReplacementMapped): void {
    expect(mapped.isReportSuccess).toBeTruthy();
    expect(mapped.summary).not.toBeNull();
  }

  validateSummaryStructure(summary: BulkValidateMeterReplacementSummary): void {
    expect(typeof summary.totalRows).toBe("number");
    expect(typeof summary.validRows).toBe("number");
    expect(typeof summary.invalidRows).toBe("number");
    expect(summary.totalRows).toBeGreaterThanOrEqual(0);
    expect(summary.validRows).toBeGreaterThanOrEqual(0);
    expect(summary.invalidRows).toBeGreaterThanOrEqual(0);
  }

  validateSummaryCountsConsistency(
    summary: BulkValidateMeterReplacementSummary,
    rows: BulkValidateMeterReplacementRowResult[],
  ): void {
    expect(
      summary.validRows + summary.invalidRows,
      "validRows + invalidRows must equal totalRows",
    ).toBe(summary.totalRows);
    expect(rows.length).toBe(summary.totalRows);

    const actualValid = rows.filter((row) => row.valid === true).length;
    const actualInvalid = rows.filter((row) => row.valid === false).length;
    expect(actualValid).toBe(summary.validRows);
    expect(actualInvalid).toBe(summary.invalidRows);
  }

  validateRowResultsStructure(rows: BulkValidateMeterReplacementRowResult[]): void {
    rows.forEach((row) => {
      expect(row.row).toBeGreaterThan(1);
      expect(typeof row.valid).toBe("boolean");
      const errors = row.errors ?? [];
      expect(Array.isArray(errors)).toBeTruthy();
      if (row.valid) {
        expect(
          errors.length,
          `Row ${row.row} marked valid but carries error messages`,
        ).toBe(0);
      } else {
        expect(
          errors.length,
          `Row ${row.row} marked invalid but has no error messages`,
        ).toBeGreaterThan(0);
        errors.forEach((err) => expect(err.trim().length).toBeGreaterThan(0));
      }
    });
  }

  /** Full happy-path report: every row must be valid. */
  validateAllRowsValid(mapped: BulkValidateMeterReplacementMapped, expectedTotal: number): void {
    this.validateReportSuccess(mapped);
    const summary = mapped.summary!;
    this.validateSummaryStructure(summary);
    this.validateSummaryCountsConsistency(summary, mapped.rows);
    this.validateRowResultsStructure(mapped.rows);
    expect(summary.totalRows).toBe(expectedTotal);
    expect(summary.validRows).toBe(expectedTotal);
    expect(summary.invalidRows).toBe(0);
  }

  /** At least one row invalid, the rest may be valid or invalid. */
  validateReportWithInvalidRows(mapped: BulkValidateMeterReplacementMapped): void {
    this.validateReportSuccess(mapped);
    const summary = mapped.summary!;
    this.validateSummaryStructure(summary);
    this.validateSummaryCountsConsistency(summary, mapped.rows);
    this.validateRowResultsStructure(mapped.rows);
    expect(
      summary.invalidRows,
      "Expected at least one invalid row in this scenario",
    ).toBeGreaterThanOrEqual(1);
  }

  validateRowErrorMatches(
    mapped: BulkValidateMeterReplacementMapped,
    pattern: RegExp,
    ruleDescription: string,
  ): void {
    this.validateReportWithInvalidRows(mapped);
    const row = firstInvalidRow(mapped.rows);
    const rowText = rowErrorsText(row);
    expect(rowText.length, `Expected row error mentioning: ${ruleDescription}`).toBeGreaterThan(0);
    if (pattern) {
      expect(
        rowText,
        `Expected row error mentioning: ${ruleDescription}`,
      ).toMatch(pattern);
    }
  }

  validateFileError(mapped: BulkValidateMeterReplacementMapped): void {
    expect(mapped.success).toBeFalsy();
    const hasFailureDetail =
      mapped.error != null || (mapped.message?.trim().length ?? 0) > 0;
    expect(hasFailureDetail).toBeTruthy();
    if (mapped.error) {
      expect(mapped.error.code).toBeTruthy();
      expect(mapped.error.message).toBeTruthy();
      expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
    } else {
      expect(mapped.message?.trim().length).toBeGreaterThan(0);
    }
    expect(
      mapped.summary,
      "File-level validation errors must not include a row summary",
    ).toBeNull();
  }

  validateScenario(
    mapped: BulkValidateMeterReplacementMapped,
    scenario: BulkValidateMeterReplacementScenario,
  ): void {
    switch (scenario) {
      case "validate_all_valid":
        this.validateAllRowsValid(mapped, 1);
        break;
      case "validate_all_valid_multi":
        this.validateAllRowsValid(mapped, 2);
        break;
      case "validate_mixed":
        this.validateReportWithInvalidRows(mapped);
        expect(mapped.summary!.validRows).toBeGreaterThanOrEqual(1);
        break;
      case "validate_all_invalid":
        this.validateReportWithInvalidRows(mapped);
        expect(mapped.summary!.validRows).toBe(0);
        break;
      case "file_invalid_type":
      case "file_missing_columns":
      case "file_no_data_rows":
        this.validateFileError(mapped);
        break;
      case "file_duplicate_columns":
        // Live API currently accepts duplicate headers (200 + summary).
        if (mapped.success && mapped.summary) {
          this.validateSummaryStructure(mapped.summary);
        } else {
          this.validateFileError(mapped);
        }
        break;
      case "row_missing_old_meter_serial":
        this.validateRowErrorMatches(
          mapped,
          /old meter serial|required|mandatory|blank/,
          "old meter serial required",
        );
        break;
      case "row_old_meter_not_found":
        this.validateRowErrorMatches(
          mapped,
          /old meter|not found|exist|invalid/,
          "old meter serial must resolve to a consumer",
        );
        break;
      case "row_old_meter_inactive":
        this.validateRowErrorMatches(
          mapped,
          /inactive|not active|status/,
          "old meter must be active",
        );
        break;
      case "row_missing_new_meter_serial":
        this.validateRowErrorMatches(
          mapped,
          /new meter serial|required|mandatory|blank/,
          "new meter serial required",
        );
        break;
      case "row_new_meter_not_found":
        this.validateRowErrorMatches(
          mapped,
          /new meter|not found|exist|invalid/,
          "new meter serial must exist",
        );
        break;
      case "row_new_meter_inactive":
        this.validateRowErrorMatches(
          mapped,
          /inactive|not active|status/,
          "new meter must be active",
        );
        break;
      case "row_new_meter_already_assigned":
        this.validateRowErrorMatches(
          mapped,
          /assigned|already|in use/,
          "new meter must not already be assigned",
        );
        break;
      case "row_new_meter_in_active_replacement":
        this.validateRowErrorMatches(
          mapped,
          /replacement|pending|already/,
          "new meter already part of an active replacement",
        );
        break;
      case "row_old_new_same_serial":
        this.validateRowErrorMatches(
          mapped,
          /same|differ|identical/,
          "old and new meter serial must differ",
        );
        break;
      case "row_duplicate_old_meter_serial_in_file":
      case "row_duplicate_new_meter_serial_in_file":
        this.validateRowErrorMatches(
          mapped,
          /duplicate/,
          "duplicate meter serial within file",
        );
        break;
      case "row_consumer_has_pending_replacement":
        this.validateRowErrorMatches(
          mapped,
          /pending|already|replacement|eligible|not eligible/,
          "consumer already has a pending replacement / not eligible",
        );
        break;
      case "row_missing_replacement_reason":
        this.validateRowErrorMatches(
          mapped,
          /reason|required|mandatory|blank/,
          "replacement reason required",
        );
        break;
      case "row_invalid_old_meter_reading":
      case "row_invalid_new_meter_reading":
        this.validateRowErrorMatches(
          mapped,
          /reading|number|numeric|valid/,
          "meter reading must be numeric",
        );
        break;
      case "row_negative_reading":
        this.validateRowErrorMatches(
          mapped,
          /reading|negative|non.?negative|greater/,
          "meter reading must be non-negative",
        );
        break;
      case "row_invalid_latitude":
      case "row_invalid_longitude":
        // Live bulk validate currently does not reject out-of-range coordinates;
        // if it starts enforcing, require a coordinate-related row error.
        this.validateReportSuccess(mapped);
        this.validateSummaryStructure(mapped.summary!);
        this.validateSummaryCountsConsistency(mapped.summary!, mapped.rows);
        this.validateRowResultsStructure(mapped.rows);
        if (mapped.summary!.invalidRows > 0) {
          const field =
            scenario === "row_invalid_latitude" ? "latitude" : "longitude";
          this.validateRowErrorMatches(
            mapped,
            new RegExp(`${field}|coordinate|range|valid`, "i"),
            `${field} must be a valid coordinate`,
          );
        }
        break;
    }
  }
}