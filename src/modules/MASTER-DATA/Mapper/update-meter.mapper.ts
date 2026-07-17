import type { UpdateMeterRequestBody } from "../Data/update-meter.data";

export interface UpdateMeterResponseData {
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
  isActiveStatus: boolean;
}

export interface UpdateMeterError {
  code: string;
  message: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
}

export interface UpdateMeterResponse {
  success: boolean;
  message?: string;
  data?: UpdateMeterResponseData;
  error?: UpdateMeterError;
}

export type UpdateMeterScenario =
  | "success"
  | "success_toggle_inactive"
  | "not_found"
  | "manufacturer_not_found"
  | "validation_error";

export interface UpdateMeterMapped {
  success: boolean;
  message: string | null;
  data: UpdateMeterResponseData | null;
  error: UpdateMeterError | null;
  isUpdateSuccess: boolean;
}

export const UPDATE_METER_SUCCESS_FIELDS = [
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
  "isActiveStatus",
] as const;

export const UPDATE_REQUEST_ECHO_FIELDS: Array<{
  requestKey: keyof UpdateMeterRequestBody;
  responseKey: keyof UpdateMeterResponseData;
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
  { requestKey: "isActiveStatus", responseKey: "isActiveStatus" },
];

export class UpdateMeterMapper {
  static map(response: UpdateMeterResponse): UpdateMeterMapped {
    const isUpdateSuccess = response.success === true && response.data != null;
    return {
      success: response.success,
      message: response.message ?? null,
      data: response.data ?? null,
      error: response.error ?? null,
      isUpdateSuccess,
    };
  }
}
