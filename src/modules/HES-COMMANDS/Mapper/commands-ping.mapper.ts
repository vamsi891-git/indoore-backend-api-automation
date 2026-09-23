export interface PingDisplayRow {
  label: string;
  value: string;
}

export interface PingMeterResult {
  meterId: string;
  status: string;
  result: string | null;
  jobStatus: string | null;
  jobName: string;
  hesStatusCode: number;
  state: string | null;
  communicationStatus: string | null;
  meterResponse: string | null;
  meterResponseRows: PingDisplayRow[];
  response: { meterId?: string; state?: string } | null;
  errorMessage?: string | null;
  commandExecutionTimeMs: number | null;
  meterResponseTimeMs: number | null;
}

export interface PingMeterStatus {
  meterId: string;
  state: string;
}

export interface PingSummary {
  requested: number;
  duplicatesRemoved: number;
  successful: number;
  failed: number;
  rejectedOutOfScope: number;
  rejectedUnknown: number;
  batchesProcessed: number;
}

export interface PingData {
  summary: PingSummary;
  successfulMeters: string[];
  rejectedMeters: string[];
  meterResults: PingMeterResult[];
  meterStatuses: PingMeterStatus[];
  hesCallbackConfigured: boolean;
  commandExecutionTimeMs: number | null;
  meterResponseTimeMs: number | null;
  note?: string | null;
}

export interface PingResponse {
  success: boolean;
  message?: string;
  data?: PingData;
  error?: { code?: string; message?: string; details?: unknown };
}

export interface MappedPingData {
  message: string;
  ping: PingData;
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapDisplayRows(
  rows: { label?: string; value?: string }[] | null | undefined,
): PingDisplayRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r?.label != null)
    .map((r) => ({
      label: String(r.label).trim(),
      value: r.value == null ? "" : String(r.value).trim(),
    }));
}

export class CommandsPingMapper {
  static mapResponse(body: PingResponse): MappedPingData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful ping response");
    }

    const { data } = body;
    return {
      message: body.message?.trim() ?? "",
      ping: {
        summary: {
          requested: data.summary.requested,
          duplicatesRemoved: data.summary.duplicatesRemoved,
          successful: data.summary.successful,
          failed: data.summary.failed,
          rejectedOutOfScope: data.summary.rejectedOutOfScope,
          rejectedUnknown: data.summary.rejectedUnknown,
          batchesProcessed: data.summary.batchesProcessed,
        },
        successfulMeters: data.successfulMeters.map((m) => m.trim()),
        rejectedMeters: data.rejectedMeters.map((m) => m.trim()),
        meterResults: data.meterResults.map((row) => ({
          meterId: row.meterId.trim(),
          status: row.status.trim(),
          result: trimOrNull(row.result),
          jobStatus: trimOrNull(row.jobStatus),
          jobName: row.jobName.trim(),
          hesStatusCode: row.hesStatusCode,
          state: trimOrNull(row.state),
          communicationStatus: trimOrNull(row.communicationStatus),
          meterResponse: trimOrNull(row.meterResponse),
          meterResponseRows: mapDisplayRows(row.meterResponseRows),
          response: row.response
            ? {
                meterId: trimOrNull(row.response.meterId) ?? undefined,
                state: trimOrNull(row.response.state) ?? undefined,
              }
            : null,
          errorMessage: trimOrNull(row.errorMessage),
          commandExecutionTimeMs:
            row.commandExecutionTimeMs == null ? null : Number(row.commandExecutionTimeMs),
          meterResponseTimeMs:
            row.meterResponseTimeMs == null ? null : Number(row.meterResponseTimeMs),
        })),
        meterStatuses: (data.meterStatuses ?? []).map((s) => ({
          meterId: s.meterId.trim(),
          state: s.state.trim(),
        })),
        hesCallbackConfigured: Boolean(data.hesCallbackConfigured),
        commandExecutionTimeMs:
          data.commandExecutionTimeMs == null ? null : Number(data.commandExecutionTimeMs),
        meterResponseTimeMs:
          data.meterResponseTimeMs == null ? null : Number(data.meterResponseTimeMs),
        note: trimOrNull(data.note),
      },
    };
  }
}
