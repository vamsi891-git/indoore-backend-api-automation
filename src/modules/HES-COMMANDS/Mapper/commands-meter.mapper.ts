export interface CommandsMeterLookupRow {
  meterLookupId: number;
  meterSerialNumber: string;
  consumerName: string | null;
  phase: string | null;
  ivrsNumber: string | null;
  feeder: string | null;
  dtr: string | null;
}

export interface CommandsMeterLookupResponse {
  success: boolean;
  data?: CommandsMeterLookupRow;
  error?: { code: string; message: string };
}

export class CommandsMeterMapper {
  static mapResponse(body: CommandsMeterLookupResponse): CommandsMeterLookupRow {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful meter lookup response");
    }

    const data = body.data;
    return {
      meterLookupId: data.meterLookupId,
      meterSerialNumber: data.meterSerialNumber.trim(),
      consumerName: data.consumerName?.trim() ?? null,
      phase: data.phase?.trim() ?? null,
      ivrsNumber: data.ivrsNumber?.trim() ?? null,
      feeder: data.feeder?.trim() ?? null,
      dtr: data.dtr?.trim() ?? null,
    };
  }
}
