import {
  HES_COMMANDS_JOB_POLL_INITIAL_DELAY_MS,
  HES_COMMANDS_JOB_POLL_INTERVAL_MS,
  HES_COMMANDS_JOB_POLL_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  QueryMeterJobResponse,
  MappedQueryMeterJobData,
} from "../Mapper/commands-query-meter-job.mapper";
import { CommandsQueryMeterJobMapper } from "../Mapper/commands-query-meter-job.mapper";

export function parsePositiveMs(
  value: string | number | undefined,
  fallback: number,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_POLL_TIMEOUT_MS = parsePositiveMs(
  process.env.JOB_POLL_TIMEOUT_MS,
  HES_COMMANDS_JOB_POLL_TIMEOUT_MS,
);
const DEFAULT_POLL_INTERVAL_MS = parsePositiveMs(
  process.env.JOB_POLL_INTERVAL_MS,
  HES_COMMANDS_JOB_POLL_INTERVAL_MS,
);

const INCOMPLETE_HES_JOB_STATUSES = new Set([
  "RUNNING",
  "PENDING",
  "IN_PROGRESS",
]);

const TERMINAL_HES_JOB_STATUSES = new Set([
  "FINISHED",
  "FAILED",
  "CANCELLED",
  "COMPLETED",
]);

export interface PollQueryMeterJobOptions {
  timeoutMs?: number;
  intervalMs?: number;
  initialDelayMs?: number;
  /** When true, poll until hesJobStatus is terminal or any meter row is SUCCESS/FAILED. */
  waitForCompletion?: boolean;
}

export interface PollQueryMeterJobResult {
  rawResponse: Awaited<
    ReturnType<CommandsQueryMeterJobApi["getQueryMeterJob"]>
  >["rawResponse"];
  responseBody: QueryMeterJobResponse;
  responseTime: number;
  mapped: MappedQueryMeterJobData;
  pollAttempts: number;
}

const QUERY_FINISHED_MESSAGE = /job finished|synced from meterStatusForJob/i;

function hasTerminalMeterRows(body: QueryMeterJobResponse): boolean {
  const rows = body.data?.meterResults ?? [];
  if (rows.length === 0) {
    return false;
  }
  return rows.every((row) => {
    const status = row.status?.trim().toUpperCase();
    return status === "SUCCESS" || status === "FAILED" || status === "REJECTED";
  });
}

export function isQueryMeterJobComplete(body: QueryMeterJobResponse): boolean {
  const hesStatus = body.data?.hesJobStatus?.trim().toUpperCase();
  if (hesStatus && INCOMPLETE_HES_JOB_STATUSES.has(hesStatus)) {
    if (
      body.message &&
      QUERY_FINISHED_MESSAGE.test(body.message) &&
      hasTerminalMeterRows(body)
    ) {
      return true;
    }
    return false;
  }
  if (hesStatus && TERMINAL_HES_JOB_STATUSES.has(hesStatus)) {
    return true;
  }

  return hasTerminalMeterRows(body);
}

export async function pollQueryMeterJob(
  api: CommandsQueryMeterJobApi,
  jobName: string,
  options: PollQueryMeterJobOptions = {},
): Promise<PollQueryMeterJobResult> {
  const timeoutMs = parsePositiveMs(options.timeoutMs, DEFAULT_POLL_TIMEOUT_MS);
  const intervalMs = parsePositiveMs(
    options.intervalMs,
    DEFAULT_POLL_INTERVAL_MS,
  );
  const initialDelayMs = parsePositiveMs(
    options.initialDelayMs,
    HES_COMMANDS_JOB_POLL_INITIAL_DELAY_MS,
  );
  const waitForCompletion = options.waitForCompletion ?? true;

  if (initialDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, initialDelayMs));
  }

  const deadline = Date.now() + timeoutMs;

  let lastResult: Awaited<ReturnType<CommandsQueryMeterJobApi["getQueryMeterJob"]>>;
  let pollAttempts = 0;
  let totalResponseTime = 0;

  do {
    pollAttempts += 1;
    lastResult = await api.getQueryMeterJob(jobName);
    totalResponseTime += lastResult.responseTime;

    if (
      !waitForCompletion ||
      lastResult.responseBody.success === false ||
      isQueryMeterJobComplete(lastResult.responseBody)
    ) {
      break;
    }

    if (Date.now() >= deadline) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (Date.now() < deadline);

  if (
    waitForCompletion &&
    lastResult.responseBody.success !== false &&
    !isQueryMeterJobComplete(lastResult.responseBody)
  ) {
    const data = lastResult.responseBody.data;
    const hesJobStatus = data?.hesJobStatus ?? "unknown";
    const meterStatus = data?.meterResults?.[0]?.status ?? "unknown";
    const meterNote = data?.meterResults?.[0]?.note ?? data?.note ?? "";
    const callbackPending = /hes callback/i.test(
      `${lastResult.responseBody.message ?? ""} ${meterNote}`,
    );
    const callbackHint = callbackPending
      ? " Job is async: backend waits for HES callback to set FINISHED/SUCCESS. " +
        "Verify HES processes billing_period_get for this meter and the callback webhook updates the job."
      : "";
    throw new Error(
      `Job ${jobName} did not reach terminal state within ${timeoutMs}ms ` +
        `(pollAttempts=${pollAttempts}, hesJobStatus=${hesJobStatus}, meterStatus=${meterStatus}).` +
        callbackHint +
        " Increase JOB_POLL_TIMEOUT_MS, run with --workers=1, or retry when HES is less loaded.",
    );
  }

  const mapped = CommandsQueryMeterJobMapper.mapResponse(lastResult.responseBody);

  return {
    rawResponse: lastResult.rawResponse,
    responseBody: lastResult.responseBody,
    responseTime: totalResponseTime,
    mapped,
    pollAttempts,
  };
}

/** Pretty-print init and query responses during E2E runs (visible in Playwright/console output). */
export function logCommandE2eResponses(
  label: string,
  init: unknown,
  query?: unknown,
  meta?: { pollAttempts?: number; jobName?: string },
): void {
  console.log(`\n=== ${label} — POST init response ===`);
  console.log(JSON.stringify(init, null, 2));
  if (query !== undefined) {
    if (meta?.pollAttempts !== undefined || meta?.jobName) {
      console.log(
        `\n--- poll: jobName=${meta.jobName ?? "n/a"}, attempts=${meta.pollAttempts ?? "n/a"} ---`,
      );
    }
    console.log(`\n=== ${label} — GET query-meter-job response ===`);
    console.log(JSON.stringify(query, null, 2));
  }
}
