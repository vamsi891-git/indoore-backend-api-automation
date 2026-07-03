export interface ValidateAddMeterQuery {
  meterSerialNumber: string;
}

export type ValidateAddMeterScenario = "valid_new" | "already_exists";

export interface ValidateAddMeterData {
  valid: boolean;
  reason?: string;
  message?: string;
}

export interface ValidateAddMeterResponse {
  success: boolean;
  data: ValidateAddMeterData;
}

export class ValidateAddMeterMapper {
  static map(response: ValidateAddMeterResponse): ValidateAddMeterResponse {
    return response;
  }
}
