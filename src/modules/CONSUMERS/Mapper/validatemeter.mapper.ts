export type ValidateMeterReason =
    | "METER_NOT_FOUND"
    | "METER_ALREADY_ASSIGNED"
    | "METER_INACTIVE"
    | "ORGANISATION_MISMATCH"
    | "OUT_OF_SCOPE";

export interface ValidateMeterData {
    valid: boolean;
    reason: string | null;
    meterLookupId?: number;
    meterSerialNumber?: string;
    organisationLookupId?: number;
    networkLookupId?: number;
    phase?: string | null;
}

export interface ValidateMeterResponse {
    success: boolean;
    data: ValidateMeterData;
}

export class ValidateMeterMapper {
    static map(response: ValidateMeterResponse): ValidateMeterData & {
        success: boolean;
    } {
        const data = response.data ?? ({} as ValidateMeterData);
        return {
            success: response.success,
            valid: data.valid ?? false,
            reason: data.reason ?? null,
            meterLookupId: data.meterLookupId,
            meterSerialNumber: data.meterSerialNumber,
            organisationLookupId: data.organisationLookupId,
            networkLookupId: data.networkLookupId,
            phase: data.phase ?? null,
        };
    }
}
