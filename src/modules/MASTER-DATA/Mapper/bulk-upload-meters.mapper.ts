export type BulkUploadMeterRowStatus =
  | "CREATED"
  | "FAILED"
  | "VALIDATION_FAILED";

export interface BulkUploadMeterRowResult {
  rowNumber: number;
  meterSerialNumber: string;
  status: BulkUploadMeterRowStatus;
  message?: string;
  messages?: string[];
  meterTblRefId?: number;
  meterLookupTblRefId?: number;
}

export interface BulkUploadMetersData {
  fileName: string;
  totalRows: number;
  createdCount: number;
  failedCount: number;
  validationFailedCount: number;
  batchesProcessed: number;
  batchSize: number;
  rowResults: BulkUploadMeterRowResult[];
}

export interface BulkUploadMetersError {
  code: string;
  message: string;
  details?: unknown;
}

export interface BulkUploadMetersResponse {
  success: boolean;
  message?: string;
  data?: BulkUploadMetersData;
  error?: BulkUploadMetersError;
}

export type BulkUploadMetersScenario =
  | "bulk_success"
  | "bulk_success_multi"
  | "bulk_success_blank_row"
  | "file_invalid_type"
  | "file_missing_columns"
  | "file_no_data_rows"
  | "file_duplicate_columns"
  | "file_manufacturer_invalid"
  | "row_duplicate_serial"
  | "row_missing_serial"
  | "row_already_exists"
  | "row_invalid_dlms"
  | "row_mf_zero"
  | "row_display_digit_zero"
  | "row_negative_mptr"
  | "row_accuracy_too_long"
  | "row_po_number_too_long"
  | "row_version_too_long"
  | "row_rating_too_long"
  | "row_asset_mismatch"
  | "row_invalid_model"
  | "row_invalid_meter_status"
  | "row_invalid_mctr"
  | "row_invalid_lptr"
  | "row_invalid_lctr"
  | "row_invalid_po_date"
  | "row_invalid_testing_date"
  | "row_display_digit_mismatch"
  | "row_future_date"
  | "row_testing_before_po";

export interface BulkUploadMetersMapped {
  success: boolean;
  message: string | null;
  data: BulkUploadMetersData | null;
  error: BulkUploadMetersError | null;
  isUploadSuccess: boolean;
}

export class BulkUploadMetersMapper {
  static map(response: BulkUploadMetersResponse): BulkUploadMetersMapped {
    const isUploadSuccess = response.success === true && response.data != null;
    return {
      success: response.success,
      message: response.message ?? null,
      data: response.data ?? null,
      error: response.error ?? null,
      isUploadSuccess,
    };
  }
}
