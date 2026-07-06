import type { CreateMeterRequestBody } from "../Data/create-meter.data";

export interface CreateMeterResponseData {
  meterTblRefId: number;
  meterLookupTblRefId: number;
  meterSerialNumber: string;
  meterRapdrpCode: string;
  assetId: string;
  mf: number;
  deviceManufacturerTblRefId: number;
  meterModelTblRefId: number;
  meterStatus: boolean;
  dlmsNonDlms: string;
}

export interface CreateMeterError {
  code: string;
  message: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
}

export interface CreateMeterResponse {
  success: boolean;
  message?: string;
  data?: CreateMeterResponseData;
  error?: CreateMeterError;
}

export type CreateMeterScenario =
  | "success"
  | "success_matching_asset"
  | "success_active_status"
  | "already_exists"
  | "manufacturer_not_found"
  | "validation_error";

export interface CreateMeterMapped {
  success: boolean;
  message: string | null;
  data: CreateMeterResponseData | null;
  error: CreateMeterError | null;
  isCreateSuccess: boolean;
}

export const CREATE_METER_SUCCESS_FIELDS = [
  "meterTblRefId",
  "meterLookupTblRefId",
  "meterSerialNumber",
  "meterRapdrpCode",
  "assetId",
  "mf",
  "deviceManufacturerTblRefId",
  "meterModelTblRefId",
  "meterStatus",
  "dlmsNonDlms",
] as const;

export const REQUEST_ECHO_FIELDS: Array<{
  requestKey: keyof CreateMeterRequestBody;
  responseKey: keyof CreateMeterResponseData;
}> = [
  { requestKey: "meterSerialNumber", responseKey: "meterSerialNumber" },
  { requestKey: "meterRapdrpCode", responseKey: "meterRapdrpCode" },
  { requestKey: "assetId", responseKey: "assetId" },
  { requestKey: "mf", responseKey: "mf" },
  {
    requestKey: "deviceManufacturerTblRefId",
    responseKey: "deviceManufacturerTblRefId",
  },
  { requestKey: "meterModelTblRefId", responseKey: "meterModelTblRefId" },
  { requestKey: "meterStatus", responseKey: "meterStatus" },
  { requestKey: "dlmsNonDlms", responseKey: "dlmsNonDlms" },
];

export class CreateMeterMapper {
  static map(response: CreateMeterResponse): CreateMeterMapped {
    const isCreateSuccess = response.success === true && response.data != null;
    return {
      success: response.success,
      message: response.message ?? null,
      data: response.data ?? null,
      error: response.error ?? null,
      isCreateSuccess,
    };
  }
}
