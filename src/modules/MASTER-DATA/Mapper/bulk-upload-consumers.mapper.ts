export type BulkUploadConsumersRowStatus =
  | "CREATED"
  | "FAILED"
  | "VALIDATION_FAILED";

export interface BulkUploadConsumersRowResult {
  rowNumber: number;
  consumerId: string;
  ivrsNumber: string;
  accountId: string;
  msn: string;
  status: BulkUploadConsumersRowStatus;
  message?: string;
  messages?: string[];
}

export interface BulkUploadConsumersData {
  fileName: string;
  totalRows: number;
  createdCount: number;
  failedCount: number;
  validationFailedCount: number;
  rowResults: BulkUploadConsumersRowResult[];
}

export interface BulkUploadConsumersError {
  code: string;
  message: string;
  details?: unknown;
}

export interface BulkUploadConsumersResponse {
  success: boolean;
  message?: string;
  data?: BulkUploadConsumersData;
  error?: BulkUploadConsumersError;
}

export type BulkUploadConsumersScenario =
  | "bulk_success"
  | "bulk_success_multi"
  | "bulk_success_blank_row"
  | "file_invalid_type"
  | "file_missing_columns"
  | "file_no_data_rows"
  | "file_duplicate_columns"
  | "file_invalid_zone"
  | "row_missing_consumer_id"
  | "row_duplicate_consumer_id"
  | "row_consumer_id_exists"
  | "row_missing_nearest_acct_id"
  | "row_invalid_nearest_acct_id"
  | "row_invalid_bill_day"
  | "row_invalid_bill_day_zero"
  | "row_invalid_consumer_category"
  | "row_invalid_billing_cycle"
  | "row_invalid_connection_type"
  | "row_invalid_connection_status"
  | "row_invalid_tod"
  | "row_invalid_substation"
  | "row_invalid_feeder"
  | "row_invalid_dtr"
  | "row_missing_msn"
  | "row_meter_not_found"
  | "row_meter_inactive"
  | "row_meter_already_mapped"
  | "row_invalid_main_sub_meter"
  | "row_invalid_meter_phase"
  | "row_missing_service_point"
  | "row_reading_zero"
  | "row_missing_sim"
  | "row_invalid_imsi"
  | "row_invalid_meter_mobile"
  | "row_invalid_ip"
  | "row_missing_modem_serial"
  | "row_invalid_imei"
  | "row_duplicate_msn";

export interface BulkUploadConsumersMapped {
  success: boolean;
  message: string | null;
  data: BulkUploadConsumersData | null;
  error: BulkUploadConsumersError | null;
  isUploadSuccess: boolean;
}

export class BulkUploadConsumersMapper {
  static map(response: BulkUploadConsumersResponse): BulkUploadConsumersMapped {
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
