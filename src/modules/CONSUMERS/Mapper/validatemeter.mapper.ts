export type ValidateMeterScenario =
  | "assignable"
  | "meter_not_in_system"
  | "already_assigned"
  | "inactive"
  | "missing_meter_serial"
  | "empty_meter_serial";

export type ValidateMeterReason =
  | "METER_NOT_FOUND"
  | "METER_ALREADY_ASSIGNED"
  | "METER_INACTIVE"
  | "ORGANISATION_MISMATCH"
  | "OUT_OF_SCOPE";

export interface ValidateMeterDetails {
  meterPhaseTblRefId?: number | null;
  simNo?: string | null;
  imsiNo?: string | null;
  mobileNo?: string | null;
  ipAddress?: string | null;
  modemSerialNumber?: string | null;
  modemImei?: string | null;
  meterInitialReading?: string | null;
  meterInitialReadingDate?: string | null;
  meterInitialReadingTime?: string | null;
  mainSubMeterTblRefId?: number | null;
  servicePointId?: string | number | null;
  dateOfService?: string | null;
  connectedToDcu?: boolean | null;
  isNetMeter?: boolean | null;
}

export interface ValidateMeterData {
  valid: boolean;
  meterExists?: boolean;
  reason?: ValidateMeterReason | string | null;
  meterLookupId?: number;
  meterSerialNumber?: string;
  organisationLookupId?: number;
  networkLookupId?: number;
  phase?: string | null;
  meterDetails?: ValidateMeterDetails;
}

export interface ValidateMeterResponse {
  success: boolean;
  data: ValidateMeterData;
}

export interface ValidateMeterErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export class ValidateMeterMapper {
  static map(response: ValidateMeterResponse): ValidateMeterResponse {
    return response;
  }

  static mapData(response: ValidateMeterResponse): ValidateMeterData {
    return response.data ?? ({} as ValidateMeterData);
  }
}
