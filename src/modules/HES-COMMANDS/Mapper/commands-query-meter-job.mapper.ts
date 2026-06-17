export interface QueryMeterJobSummary {
  requested: number;
  successful: number;
  failed: number;
  inProgress: number;
  rejected: number;
}

export interface QueryMeterJobHesResponse {
  message?: string;
  /** HTTP status code (number) or HES operation status (e.g. "SUCCESS"). */
  status?: number | string;
  meterId?: string;
  failureStep?: string;
  progress?: unknown;
  response?: unknown[];
  [key: string]: unknown;
}

export interface QueryMeterJobMeterResult {
  meterId: string;
  action: string;
  status: string;
  hesStatusCode: number;
  errorMessage?: string | null;
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
          errorMessage: row.errorMessage?.trim() ?? null,
          hesResponse: row.hesResponse ?? null,
        })),
      },
    };
  }
}
