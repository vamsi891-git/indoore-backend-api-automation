import { CreateConsumerRequestBody } from "../Data/create-consumer.data";

export type CreateConsumerResponseData = Record<
  string,
  string | number | boolean | null
>;

export interface CreateConsumerError {
  code: string;
  message: string;
  details?: unknown;
}

export interface CreateConsumerResponse {
  success: boolean;
  message?: string;
  data?: CreateConsumerResponseData;
  error?: CreateConsumerError;
}

export interface CreateConsumerMapped {
  success: boolean;
  message: string | null;
  data: CreateConsumerResponseData | null;
  error: CreateConsumerError | null;
  isCreateSuccess: boolean;
}

export type CreateConsumerScenario =
  | "create_success"
  | "missing_consumer_id"
  | "missing_nearest_acct_id"
  | "invalid_nearest_acct_id"
  | "invalid_bill_day"
  | "invalid_bill_day_zero"
  | "invalid_consumer_category"
  | "invalid_billing_cycle"
  | "invalid_connection_type"
  | "invalid_connection_status"
  | "invalid_tod"
  | "invalid_substation"
  | "invalid_feeder"
  | "invalid_dtr"
  | "missing_msn"
  | "meter_not_found"
  | "meter_inactive"
  | "meter_already_mapped"
  | "invalid_main_sub_meter"
  | "invalid_meter_phase"
  | "missing_service_point"
  | "reading_zero"
  | "missing_sim"
  | "invalid_imsi"
  | "invalid_meter_mobile"
  | "invalid_ip"
  | "missing_modem_serial"
  | "consumer_id_exists";

export const CREATE_SUCCESS_FIELDS = [
  "Consumer ID",
  "Consumer Name",
  "Mobile No.",
  "Address",
  "IVRS Number",
  "Account ID",
  "MSN",
] as const;

export const REQUEST_ECHO_FIELDS: Array<{
  requestKey: keyof CreateConsumerRequestBody | string;
  responseKey: string;
}> = [
  { requestKey: "Consumer ID", responseKey: "Consumer ID" },
  { requestKey: "Consumer Name", responseKey: "Consumer Name" },
  { requestKey: "Father Name", responseKey: "Father Name" },
  { requestKey: "Email ID", responseKey: "Email ID" },
  { requestKey: "Mobile No.", responseKey: "Mobile No." },
  { requestKey: "Land Line No.", responseKey: "Land Line No." },
  { requestKey: "Address", responseKey: "Address" },
  { requestKey: "Pin Code", responseKey: "Pin Code" },
  { requestKey: "Sub Station", responseKey: "Sub Station" },
  { requestKey: "Feeder", responseKey: "Feeder" },
  { requestKey: "DTR", responseKey: "DTR" },
  { requestKey: "IVRS Number", responseKey: "IVRS Number" },
  { requestKey: "Account ID", responseKey: "Account ID" },
  { requestKey: "Nearest Acct. ID", responseKey: "Nearest Acct. ID" },
  { requestKey: "Sanctioned Load (KW)", responseKey: "Sanctioned Load (KW)" },
  { requestKey: "MR Code", responseKey: "MR Code" },
  { requestKey: "MSN", responseKey: "MSN" },
  { requestKey: "Service Point ID", responseKey: "Service Point ID" },
  { requestKey: "Date Of Service", responseKey: "Date Of Service" },
  { requestKey: "Nature Of Business", responseKey: "Nature Of Business" },
  { requestKey: "Bill Day", responseKey: "Bill Day" },
  { requestKey: "Connected Phase", responseKey: "Connected Phase" },
  {
    requestKey: "Activate/Deactivate Remarks",
    responseKey: "Activate/Deactivate Remarks",
  },
];

export class CreateConsumerMapper {
  static map(response: CreateConsumerResponse): CreateConsumerMapped {
    const status = response.success === true && response.data != null;
    return {
      success: response.success,
      message: response.message ?? null,
      data: response.data ?? null,
      error: response.error ?? null,
      isCreateSuccess: status,
    };
  }
}
