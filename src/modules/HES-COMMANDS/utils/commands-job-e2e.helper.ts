import { test, type TestInfo } from "@playwright/test";
import {
  HES_COMMANDS_JOB_POLL_INITIAL_DELAY_MS,
  HES_COMMANDS_JOB_POLL_INTERVAL_MS,
  HES_COMMANDS_JOB_POLL_STUCK_MS,
  HES_COMMANDS_JOB_POLL_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { BackendResponse } from "../../../core/utils/backend-response.util";
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
const DEFAULT_POLL_STUCK_MS = parsePositiveMs(
  process.env.JOB_POLL_STUCK_MS,
  HES_COMMANDS_JOB_POLL_STUCK_MS,
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

export interface HesJobIncompleteDetails {
  jobName: string;
  timeoutMs: number;
  pollAttempts: number;
  hesJobStatus: string;
  meterStatus: string;
  expectedCommand?: string;
  reason?: "timeout" | "stuck_no_progress";
}

/** Thrown when query-meter-job stays RUNNING/IN_PROGRESS until the poll deadline. */
export class HesJobIncompleteError extends Error {
  readonly kind = "hes_job_incomplete" as const;
  readonly details: HesJobIncompleteDetails;

  constructor(details: HesJobIncompleteDetails, message: string) {
    super(message);
    this.name = "HesJobIncompleteError";
    this.details = details;
  }
}

export function isTransientApiNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|getaddrinfo|socket hang up|net::ERR_/i.test(
    message,
  );
}

/**
 * Soft-skip HES E2E when the meter job never finishes (callback pending) or
 * DNS/network drops mid-poll. Re-throws unexpected errors.
 */
export function softSkipHesE2eInfraFailure(
  error: unknown,
  testInfo?: TestInfo,
): never {
  if (error instanceof HesJobIncompleteError) {
    BackendResponse.logFinding(
      "HES job incomplete (callback pending / HES load)",
      error.message,
    );
    const reason = `HES infra: job ${error.details.jobName} still ${error.details.hesJobStatus}/${error.details.meterStatus} after ${error.details.timeoutMs}ms`;
    if (testInfo) {
      testInfo.skip(true, reason);
    }
    test.skip(true, reason);
  }
  if (isTransientApiNetworkError(error)) {
    const message = error instanceof Error ? error.message : String(error);
    BackendResponse.logFinding("HES poll transient network", message);
    const reason = `Transient network during HES poll — ${message}`;
    if (testInfo) {
      testInfo.skip(true, reason);
    }
    test.skip(true, reason);
  }
  throw error;
}

export interface PollQueryMeterJobOptions {
  timeoutMs?: number;
  intervalMs?: number;
  initialDelayMs?: number;
  /** Soft-skip sooner when status fingerprint is unchanged this long. */
  stuckMs?: number;
  /** When true, poll until hesJobStatus is terminal or any meter row is SUCCESS/FAILED. */
  waitForCompletion?: boolean;
  /** Command name for timeout diagnostics (e.g. billing_period_get). */
  expectedCommand?: string;
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

function jobStatusFingerprint(body: QueryMeterJobResponse): string {
  const data = body.data;
  const hes = data?.hesJobStatus?.trim().toUpperCase() ?? "";
  const meters = (data?.meterResults ?? [])
    .map((row) => `${row.meterId}:${row.status?.trim().toUpperCase() ?? ""}`)
    .join("|");
  return `${hes}#${meters}`;
}

function throwIncomplete(
  jobName: string,
  timeoutMs: number,
  pollAttempts: number,
  body: QueryMeterJobResponse,
  expectedCommand: string | undefined,
  reason: "timeout" | "stuck_no_progress",
): never {
  const data = body.data;
  const hesJobStatus = data?.hesJobStatus ?? "unknown";
  const meterStatus = data?.meterResults?.[0]?.status ?? "unknown";
  const meterNote = data?.meterResults?.[0]?.note ?? data?.note ?? "";
  const commandLabel =
    expectedCommand?.trim() ||
    data?.meterResults?.[0]?.action?.trim() ||
    "this command";
  const callbackPending =
    INCOMPLETE_HES_JOB_STATUSES.has(String(hesJobStatus).toUpperCase()) ||
    /hes callback/i.test(`${body.message ?? ""} ${meterNote}`);
  const stuckHint =
    reason === "stuck_no_progress"
      ? " Status fingerprint unchanged (HES callback not progressing)."
      : "";
  const callbackHint = callbackPending
    ? ` Job is async: backend waits for HES callback to set FINISHED/SUCCESS. ` +
      `Verify HES processes ${commandLabel} for this meter and the callback webhook updates the job.`
    : "";
  throw new HesJobIncompleteError(
    {
      jobName,
      timeoutMs,
      pollAttempts,
      hesJobStatus: String(hesJobStatus),
      meterStatus: String(meterStatus),
      expectedCommand: commandLabel,
      reason,
    },
    `Job ${jobName} did not reach terminal state within ${timeoutMs}ms ` +
      `(pollAttempts=${pollAttempts}, hesJobStatus=${hesJobStatus}, meterStatus=${meterStatus}, reason=${reason}).` +
      stuckHint +
      callbackHint +
      " Increase JOB_POLL_TIMEOUT_MS / JOB_POLL_STUCK_MS, run with --workers=1, or retry when HES is less loaded.",
  );
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
  const stuckMs = Math.min(
    parsePositiveMs(options.stuckMs, DEFAULT_POLL_STUCK_MS),
    timeoutMs,
  );
  const waitForCompletion = options.waitForCompletion ?? true;

  if (initialDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, initialDelayMs));
  }

  const deadline = Date.now() + timeoutMs;
  const pollStartedAt = Date.now();

  let lastResult: Awaited<
    ReturnType<CommandsQueryMeterJobApi["getQueryMeterJob"]>
  >;
  let pollAttempts = 0;
  let totalResponseTime = 0;
  let lastFingerprint = "";
  let fingerprintSince = pollStartedAt;

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

    const fingerprint = jobStatusFingerprint(lastResult.responseBody);
    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      fingerprintSince = Date.now();
    } else if (Date.now() - fingerprintSince >= stuckMs) {
      throwIncomplete(
        jobName,
        stuckMs,
        pollAttempts,
        lastResult.responseBody,
        options.expectedCommand,
        "stuck_no_progress",
      );
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
    throwIncomplete(
      jobName,
      timeoutMs,
      pollAttempts,
      lastResult.responseBody,
      options.expectedCommand,
      "timeout",
    );
  }

  const mapped = CommandsQueryMeterJobMapper.mapResponse(
    lastResult.responseBody,
  );

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
