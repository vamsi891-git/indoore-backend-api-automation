/**
 * Response contract for POST /indore/meter-replacement/bulk/validate
 * (per the API response sample provided — dry-run validation only, no persistence).
 */

export interface BulkValidateMeterReplacementSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface BulkValidateMeterReplacementRowResult {
  row: number;
  valid: boolean;
  errors: string[];
}

export interface BulkValidateMeterReplacementError {
  code: string;
  message: string;
  details?: unknown;
}

export interface BulkValidateMeterReplacementResponse {
  success: boolean;
  message?: string;
  summary?: BulkValidateMeterReplacementSummary;
  rows?: BulkValidateMeterReplacementRowResult[];
  error?: BulkValidateMeterReplacementError;
}

/**
 * Scenario catalogue. Row-level scenarios map to the createSubmission /
 * resolveConsumerByOldMeterSerial / findMeterForValidation checks in
 * meter-replacement.repository.ts.
 */
export type BulkValidateMeterReplacementScenario =
  | "validate_all_valid"
  | "validate_all_valid_multi"
  | "validate_mixed"
  | "validate_all_invalid"
  | "file_invalid_type"
  | "file_missing_columns"
  | "file_no_data_rows"
  | "file_duplicate_columns"
  | "row_missing_old_meter_serial"
  | "row_old_meter_not_found"
  | "row_old_meter_inactive"
  | "row_missing_new_meter_serial"
  | "row_new_meter_not_found"
  | "row_new_meter_inactive"
  | "row_new_meter_already_assigned"
  | "row_new_meter_in_active_replacement"
  | "row_old_new_same_serial"
  | "row_duplicate_old_meter_serial_in_file"
  | "row_duplicate_new_meter_serial_in_file"
  | "row_consumer_has_pending_replacement"
  | "row_missing_replacement_reason"
  | "row_invalid_old_meter_reading"
  | "row_invalid_new_meter_reading"
  | "row_negative_reading"
  | "row_invalid_latitude"
  | "row_invalid_longitude";

export interface BulkValidateMeterReplacementMapped {
  success: boolean;
  message: string | null;
  summary: BulkValidateMeterReplacementSummary | null;
  rows: BulkValidateMeterReplacementRowResult[];
  error: BulkValidateMeterReplacementError | null;
  isReportSuccess: boolean;
}

export class BulkValidateMeterReplacementMapper {
  static map(
    response: BulkValidateMeterReplacementResponse,
  ): BulkValidateMeterReplacementMapped {
    const isReportSuccess = response.success === true && response.summary != null;
    return {
      success: response.success,
      message: response.message ?? null,
      summary: response.summary ?? null,
      rows: response.rows ?? [],
      error: response.error ?? null,
      isReportSuccess,
    };
  }
}