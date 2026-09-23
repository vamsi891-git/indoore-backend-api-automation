export interface MeterResponseRow {
  label: string;
  value: string;
}

export interface CommandsHistoryRow {
  sno: number;
  /** Job/request identifier — API returns string (may exceed MAX_SAFE_INTEGER). */
  requestId: string;
  jobName: string;
  bulkJobId: string | null;
  requestedBy: string;
  uniqueId: string;
  commandName: string;
  selectedMeter: string;
  meterSerialNumber: string;
  selectionType: string;
  requestedTime: string;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  executionDurationMs: number | null;
  status: string;
  overallStatus: string;
  totalMeters: number;
  processedMeters: number;
  successfulMeters: number;
  failedMeters: number;
  pendingMeters: number;
  stoppedMeters: number;
  reason: string | null;
  message: string | null;
  note: string | null;
  meterResponse: string | null;
  meterResponseRows: MeterResponseRow[];
  lastStatusCheckAt: string | null;
  statusCheckAttempts: number | null;
  maxStatusCheckAttempts: number | null;
  executionDeadlineAt: string | null;
  statusUpdateDelayed: boolean;
  failureCode: string | null;
  failureReason: string | null;
  retryCount: number | null;
  attemptCount: number | null;
  maxRetries: number | null;
  nextAttemptAt: string | null;
  isRetryScheduled: boolean;
  retryWindowStartedAt: string | null;
}

export interface CommandsHistoryPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CommandsHistoryResponse {
  success: boolean;
  message?: string;
  data?: CommandsHistoryRow[];
  pagination?: CommandsHistoryPagination;
  error?: { code: string; message: string };
}

export interface CommandsHistoryData {
  rows: CommandsHistoryRow[];
  pagination: CommandsHistoryPagination;
  message: string;
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class CommandsHistoryMapper {
  static mapResponse(body: CommandsHistoryResponse): CommandsHistoryData {
    if (!body.success || !body.data || !body.pagination) {
      throw new Error("Cannot map unsuccessful commands history response");
    }

    return {
      message: body.message?.trim() ?? "",
      rows: body.data.map((row) => ({
        sno: row.sno,
        requestId: String(row.requestId).trim(),
        jobName: String(row.jobName ?? "").trim(),
        bulkJobId: trimOrNull(row.bulkJobId),
        requestedBy: String(row.requestedBy ?? "").trim(),
        uniqueId: String(row.uniqueId ?? "").trim(),
        commandName: String(row.commandName ?? "").trim(),
        selectedMeter: String(row.selectedMeter ?? "").trim(),
        meterSerialNumber: String(row.meterSerialNumber ?? "").trim(),
        selectionType: String(row.selectionType ?? "").trim(),
        requestedTime: String(row.requestedTime ?? "").trim(),
        requestedAt: String(row.requestedAt ?? "").trim(),
        startedAt: trimOrNull(row.startedAt),
        completedAt: trimOrNull(row.completedAt),
        executionDurationMs:
          row.executionDurationMs == null ? null : Number(row.executionDurationMs),
        status: String(row.status ?? "").trim(),
        overallStatus: String(row.overallStatus ?? "").trim(),
        totalMeters: Number(row.totalMeters ?? 0),
        processedMeters: Number(row.processedMeters ?? 0),
        successfulMeters: Number(row.successfulMeters ?? 0),
        failedMeters: Number(row.failedMeters ?? 0),
        pendingMeters: Number(row.pendingMeters ?? 0),
        stoppedMeters: Number(row.stoppedMeters ?? 0),
        reason: trimOrNull(row.reason),
        message: trimOrNull(row.message),
        note: trimOrNull(row.note),
        meterResponse: trimOrNull(row.meterResponse),
        meterResponseRows: (row.meterResponseRows ?? []).map((item) => ({
          label: String(item.label ?? "").trim(),
          value: String(item.value ?? "").trim(),
        })),
        lastStatusCheckAt: trimOrNull(row.lastStatusCheckAt),
        statusCheckAttempts:
          row.statusCheckAttempts == null ? null : Number(row.statusCheckAttempts),
        maxStatusCheckAttempts:
          row.maxStatusCheckAttempts == null ? null : Number(row.maxStatusCheckAttempts),
        executionDeadlineAt: trimOrNull(row.executionDeadlineAt),
        statusUpdateDelayed: Boolean(row.statusUpdateDelayed),
        failureCode: trimOrNull(row.failureCode),
        failureReason: trimOrNull(row.failureReason),
        retryCount: row.retryCount == null ? null : Number(row.retryCount),
        attemptCount: row.attemptCount == null ? null : Number(row.attemptCount),
        maxRetries: row.maxRetries == null ? null : Number(row.maxRetries),
        nextAttemptAt: trimOrNull(row.nextAttemptAt),
        isRetryScheduled: Boolean(row.isRetryScheduled),
        retryWindowStartedAt: trimOrNull(row.retryWindowStartedAt),
      })),
      pagination: body.pagination,
    };
  }
}
