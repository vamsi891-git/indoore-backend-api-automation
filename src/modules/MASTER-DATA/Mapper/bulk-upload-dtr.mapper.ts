export type BulkUploadDtrRowStatus =
  | "CREATED"
  | "FAILED"
  | "VALIDATION_FAILED";

export interface BulkUploadDtrRowResult {
  rowNumber: number;
  dtrCode: string;
  meterSerialNumber: string;
  status: BulkUploadDtrRowStatus;
  message?: string;
  messages?: string[];
  networkLookupId?: number;
  meterLookupId?: number;
}

export interface BulkUploadDtrData {
  fileName: string;
  totalRows: number;
  createdCount: number;
  failedCount: number;
  validationFailedCount: number;
  alreadyExistsCount?: number;
  batchesProcessed?: number;
  batchSize?: number;
  rowResults: BulkUploadDtrRowResult[];
}

export interface BulkUploadDtrError {
  code: string;
  message: string;
  details?: unknown;
}

export interface BulkUploadDtrResponse {
  success: boolean;
  message?: string;
  data?: BulkUploadDtrData;
  error?: BulkUploadDtrError;
}

export type BulkUploadDtrScenario =
  | "bulk_success"
  | "bulk_success_multi"
  | "bulk_success_blank_row"
  | "file_invalid_type"
  | "file_missing_columns"
  | "file_no_data_rows"
  | "file_duplicate_columns"
  | "file_invalid_zone"
  | "row_missing_dtr_code"
  | "row_missing_dtr_name"
  | "row_duplicate_dtr_code"
  | "row_dtr_code_exists"
  | "row_capacity_zero"
  | "row_invalid_status"
  | "row_invalid_substation"
  | "row_missing_meter_serial"
  | "row_meter_not_found"
  | "row_meter_inactive"
  | "row_meter_on_dtr"
  | "row_invalid_main_sub_meter"
  | "row_invalid_meter_phase"
  | "row_missing_service_point"
  | "row_missing_sim"
  | "row_invalid_imsi"
  | "row_invalid_ip"
  | "row_missing_modem_serial"
  | "row_invalid_imei"
  | "row_invalid_service_date"
  | "row_future_service_date"
  | "row_future_entry_date"
  | "row_reading_zero";

export interface BulkUploadDtrMapped {
  success: boolean;
  message: string | null;
  data: BulkUploadDtrData | null;
  error: BulkUploadDtrError | null;
  isUploadSuccess: boolean;
}

export class BulkUploadDtrMapper {
  static map(response: BulkUploadDtrResponse): BulkUploadDtrMapped {
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
