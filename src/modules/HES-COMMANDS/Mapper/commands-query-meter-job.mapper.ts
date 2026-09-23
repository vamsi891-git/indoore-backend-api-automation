export interface MeterResponseDisplayRow {
  label: string;
  value: string;
}

export interface QueryMeterJobSummary {
  requested: number;
  successful: number;
  failed: number;
  inProgress: number;
  rejected: number;
}

export interface QueryMeterJobMdmsMeta {
  startedAt?: string;
  completedAt?: string;
  executionDurationMs?: number;
  publicRequestId?: string;
  commandApiType?: string;
  commandData?: Record<string, unknown>;
  executionDeadlineAt?: string;
  leaseOwner?: string | null;
  leaseExpiresAt?: string | null;
  retryAt?: string | null;
  [key: string]: unknown;
}

export interface QueryMeterJobHesResponse {
  message?: string;
  /** HTTP status code (number) or HES operation status (e.g. "SUCCESS"). */
  status?: number | string;
  meterId?: string;
  failureStep?: string;
  progress?: unknown;
  response?: unknown[];
  __mdmsMeta?: QueryMeterJobMdmsMeta;
  [key: string]: unknown;
}

export interface QueryMeterJobMeterResult {
  meterId: string;
  action: string;
  status: string;
  hesStatusCode: number;
  errorMessage?: string | null;
  reason?: string | null;
  message?: string | null;
  note?: string | null;
  meterResponse?: string | null;
  meterResponseRows?: MeterResponseDisplayRow[];
  hesResponse?: QueryMeterJobHesResponse | null;
}

export interface QueryMeterJobData {
  jobName: string;
  synced: boolean;
  autoSynced: boolean;
  hesJobStatus: string | null;
  hesStatusCode: number;
  summary: QueryMeterJobSummary;
  meterResults: QueryMeterJobMeterResult[];
  reason?: string | null;
  message?: string | null;
  note?: string | null;
  meterResponse?: string | null;
  meterResponseRows?: MeterResponseDisplayRow[];
}

export interface QueryMeterJobResponse {
  success: boolean;
  message?: string;
  data?: QueryMeterJobData;
  error?: { code?: string; message?: string };
}

export interface MappedQueryMeterJobData {
  message: string;
  job: QueryMeterJobData;
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapDisplayRows(rows: MeterResponseDisplayRow[] | undefined): MeterResponseDisplayRow[] {
  return (rows ?? []).map((item) => ({
    label: String(item.label ?? "").trim(),
    value: String(item.value ?? "").trim(),
  }));
}

export class CommandsQueryMeterJobMapper {
  static mapResponse(body: QueryMeterJobResponse): MappedQueryMeterJobData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful query-meter-job response");
    }

    const { data } = body;
    return {
      message: body.message?.trim() ?? "",
      job: {
        jobName: data.jobName.trim(),
        synced: data.synced,
        autoSynced: data.autoSynced,
        hesJobStatus: data.hesJobStatus?.trim() ?? null,
        hesStatusCode: data.hesStatusCode,
        summary: {
          requested: data.summary.requested,
          successful: data.summary.successful,
          failed: data.summary.failed,
          inProgress: data.summary.inProgress,
          rejected: data.summary.rejected,
        },
        meterResults: data.meterResults.map((row) => ({
          meterId: row.meterId.trim(),
          action: row.action.trim(),
          status: row.status.trim(),
          hesStatusCode: row.hesStatusCode,
          errorMessage: trimOrNull(row.errorMessage),
          reason: trimOrNull(row.reason),
          message: trimOrNull(row.message),
          note: trimOrNull(row.note),
          meterResponse: trimOrNull(row.meterResponse),
          meterResponseRows: mapDisplayRows(row.meterResponseRows),
          hesResponse: row.hesResponse ?? null,
        })),
        reason: trimOrNull(data.reason),
        message: trimOrNull(data.message),
        note: trimOrNull(data.note),
        meterResponse: trimOrNull(data.meterResponse),
        meterResponseRows: mapDisplayRows(data.meterResponseRows),
      },
    };
  }
}
