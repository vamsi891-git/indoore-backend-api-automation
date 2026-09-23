export const commandsHistoryData = {
  defaultPage: 1,
  defaultLimit: 10,
  maxResponseTimeMs: 60_000,
  /** Search term — meter serial with known history rows. */
  searchMeterSerial: process.env.VALID_METER_SERIAL?.trim() || "99751580",
  /** commandType filter — backend ILIKE on command_name. */
  searchCommandType: "Get Relay Status",
} as const;

/** Root response keys (excluding error). */
export const EXPECTED_HISTORY_RESPONSE_KEYS = ["success", "message", "data", "pagination"] as const;

/** Row field keys from GET /indore/commands/history. */
export const EXPECTED_HISTORY_ROW_KEYS = [
  "sno",
  "requestId",
  "jobName",
  "bulkJobId",
  "requestedBy",
  "uniqueId",
  "commandName",
  "selectedMeter",
  "meterSerialNumber",
  "selectionType",
  "requestedTime",
  "requestedAt",
  "startedAt",
  "completedAt",
  "executionDurationMs",
  "status",
  "overallStatus",
  "totalMeters",
  "processedMeters",
  "successfulMeters",
  "failedMeters",
  "pendingMeters",
  "stoppedMeters",
  "reason",
  "message",
  "note",
  "meterResponse",
  "meterResponseRows",
  "lastStatusCheckAt",
  "statusCheckAttempts",
  "maxStatusCheckAttempts",
  "executionDeadlineAt",
  "statusUpdateDelayed",
  "failureCode",
  "failureReason",
  "retryCount",
  "attemptCount",
  "maxRetries",
  "nextAttemptAt",
  "isRetryScheduled",
  "retryWindowStartedAt",
] as const;

export const EXPECTED_HISTORY_PAGINATION_KEYS = [
  "currentPage",
  "totalPages",
  "totalRecords",
  "limit",
  "hasNextPage",
  "hasPreviousPage",
] as const;

export interface CommandsHistoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  commandType?: string;
  fromDate?: string;
  toDate?: string;
  organisationLookupId?: number;
  networkLookupId?: number;
}

export function buildCommandsHistoryPath(query: CommandsHistoryQuery = {}): string {
  const page = query.page ?? commandsHistoryData.defaultPage;
  const limit = query.limit ?? commandsHistoryData.defaultLimit;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }
  if (query.commandType?.trim()) {
    params.set("commandType", query.commandType.trim());
  }
  if (query.fromDate?.trim()) {
    params.set("fromDate", query.fromDate.trim());
  }
  if (query.toDate?.trim()) {
    params.set("toDate", query.toDate.trim());
  }
  if (query.organisationLookupId !== undefined) {
    params.set("organisationLookupId", String(query.organisationLookupId));
  }
  if (query.networkLookupId !== undefined) {
    params.set("networkLookupId", String(query.networkLookupId));
  }

  return `/indore/commands/history?${params.toString()}`;
}
