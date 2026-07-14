export interface MeterValidationData {
  valid: boolean;
  message: string;
  meterLookupId: number;
  meterSerial: string;
}

export interface MeterValidationResponse {
  success: boolean;
  data: MeterValidationData;
}

export class MeterValidationMapper {
  static map(
    response: MeterValidationResponse,
  ): MeterValidationData & { success: boolean } {
    const data = response.data ?? ({} as MeterValidationData);
    return {
      success: response.success,
      valid: data.valid ?? false,
      message: data.message?.trim() ?? "",
      meterLookupId: Number(data.meterLookupId) || 0,
      meterSerial: data.meterSerial?.trim() ?? "",
    };
  }
}
