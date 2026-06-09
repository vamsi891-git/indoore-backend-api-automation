import {
  MeterJobCallbackPayload,
  MeterJobMeterStatus,
  MeterJobRequest,
  MeterJobSummary
} from "../shared/meter-job.types";

export interface MappedMeterJob {
  jobName: string;
  status: string;
  jobType?: string;
  createTime?: string;
  updateTime?: string;
  timeoutTime?: string;
  totalProcessedDevices?: number;
  totalSuccessfulDevices?: number;
  totalFailedDevices?: number;
  raw: MeterJobSummary;
}

export interface MappedMeterStatusRow {
  meterId: string;
  status: string;
  failureStep?: number;
  response: unknown;
}

export class MeterJobMapper {
  static mapSummary(body: unknown): MappedMeterJob {
    const raw = (body ?? {}) as MeterJobSummary;
    return {
      jobName: String(raw.jobName ?? ""),
      status: String(raw.status ?? ""),
      jobType: raw.jobType ? String(raw.jobType) : undefined,
      createTime: raw.createTime,
      updateTime: raw.updateTime,
      timeoutTime: raw.timeoutTime,
      totalProcessedDevices: raw.totalProcessedDevices,
      totalSuccessfulDevices: raw.totalSuccessfulDevices,
      totalFailedDevices: raw.totalFailedDevices,
      raw
    };
  }

  static mapCreateResponse(body: unknown): MappedMeterJob {
    return this.mapSummary(body);
  }

  static mapQueryResponse(body: unknown): MappedMeterJob {
    return this.mapSummary(body);
  }

  static mapMeterStatusRows(body: unknown): MappedMeterStatusRow[] {
    if (!body || typeof body !== "object") {
      return [];
    }

    const record = body as Record<string, unknown>;
    const rows = Array.isArray(record.meters)
      ? record.meters
      : Array.isArray(record.items)
        ? record.items
        : Array.isArray(body)
          ? body
          : [];

    return (rows as MeterJobMeterStatus[]).map((item) => ({
      meterId: String(item.meterId ?? ""),
      status: String(item.status ?? ""),
      failureStep:
        item.failureStep !== undefined ? Number(item.failureStep) : undefined,
      response: item.response ?? null
    }));
  }

  static mapCallbackPayload(body: unknown): MeterJobCallbackPayload | null {
    if (!body || typeof body !== "object") {
      return null;
    }

    return body as MeterJobCallbackPayload;
  }

  static mapRequestEcho(request: MeterJobRequest) {
    return {
      jobType: request.jobType,
      jobName: request.jobName,
      meterCount: request.meters.length,
      commandCount: request.jobConfiguration.commands.length,
      callbackUrl: request.callback.callbackUrl,
      callbackOn: request.callback.callbackOn,
      timeoutTime: request.timeoutTime
    };
  }
}
