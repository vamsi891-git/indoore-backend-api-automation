export interface DeactivateMeterResponseData {
  meterLookupTblRefId: number;
  meterTblRefId: number;
  meterSerialNumber: string;
  isActiveStatus: boolean;
  previousIsActiveStatus: boolean;
}

export interface DeactivateMeterError {
  code: string;
  message: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
}

export interface DeactivateMeterResponse {
  success: boolean;
  message?: string;
  data?: DeactivateMeterResponseData;
  error?: DeactivateMeterError;
}

export type DeactivateMeterScenario =
  | "success"
  | "already_inactive"
  | "not_found";

export interface DeactivateMeterMapped {
  success: boolean;
  message: string | null;
  data: DeactivateMeterResponseData | null;
  error: DeactivateMeterError | null;
  isDeactivateSuccess: boolean;
}

export const DEACTIVATE_METER_SUCCESS_FIELDS = [
  "meterLookupTblRefId",
  "meterTblRefId",
  "meterSerialNumber",
  "isActiveStatus",
  "previousIsActiveStatus",
] as const;

export class DeactivateMeterMapper {
  static map(response: DeactivateMeterResponse): DeactivateMeterMapped {
    const isDeactivateSuccess =
      response.success === true && response.data != null;
    return {
      success: response.success,
      message: response.message ?? null,
      data: response.data ?? null,
      error: response.error ?? null,
      isDeactivateSuccess,
    };
  }
}
