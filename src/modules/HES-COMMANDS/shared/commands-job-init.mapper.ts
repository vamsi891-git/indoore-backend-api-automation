export interface CommandJobInitSummary {
  requested: number;
  duplicatesRemoved: number;
  successful: number;
  failed: number;
  rejectedOutOfScope: number;
  rejectedUnknown: number;
  batchesProcessed: number;
}

export interface CommandJobInitMeterResult {
  meterId: string;
  status: string;
  jobName: string;
  hesStatusCode: number;
  errorMessage?: string | null;
}

export interface CommandJobInitData {
  summary: CommandJobInitSummary;
  successfulMeters: string[];
  rejectedMeters: string[];
  meterResults: CommandJobInitMeterResult[];
  hesCallbackConfigured?: boolean;
  note?: string;
}

export interface CommandJobInitResponse {
  success: boolean;
  message?: string;
  data?: CommandJobInitData;
  error?: { code?: string; message?: string; details?: unknown };
}

export interface MappedCommandJobInitData {
  message: string;
  init: CommandJobInitData;
}

export class CommandsJobInitMapper {
  static mapResponse(body: CommandJobInitResponse): MappedCommandJobInitData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful command job-init response");
    }

    const { data } = body;
    return {
      message: body.message?.trim() ?? "",
      init: {
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
          jobName: row.jobName.trim(),
          hesStatusCode: row.hesStatusCode,
          errorMessage: row.errorMessage?.trim() ?? null,
        })),
        hesCallbackConfigured: data.hesCallbackConfigured,
        note: data.note?.trim(),
      },
    };
  }
}

/** Extract unique job names from POST init meterResults (one per meter batch). */
export function extractJobNamesFromInitResponse(
  body: CommandJobInitResponse,
): string[] {
  if (!body.success || !body.data?.meterResults?.length) {
    throw new Error("No meterResults with jobName in command job-init response");
  }

  const names = body.data.meterResults
    .map((r) => r.jobName?.trim())
    .filter((name): name is string => Boolean(name));

  return [...new Set(names)];
}
