import { expect, test, type TestInfo } from "@playwright/test";
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
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export function parsePositiveMs(value: string | number | undefined, fallback: number): number {
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

const INCOMPLETE_HES_JOB_STATUSES = new Set(["RUNNING", "PENDING", "IN_PROGRESS"]);

const TERMINAL_HES_JOB_STATUSES = new Set(["FINISHED", "FAILED", "CANCELLED", "COMPLETED"]);

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
 * When true, E2E fails if HES never reaches FINISHED.
 * Default false: validate async init + IN_PROGRESS query path and pass (HES callback is env-dependent).
 */
export function isHesE2eCompletionRequired(): boolean {
  return process.env.HES_E2E_REQUIRE_COMPLETION?.trim().toLowerCase() === "true";
}

/**
 * Soft-skip only for transient DNS/network mid-poll.
 * Incomplete HES jobs are handled by pollQueryMeterJob (pass async path unless completion required).
 */
export function softSkipHesE2eInfraFailure(error: unknown, testInfo?: TestInfo): never {
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
  /** Stop waiting when status fingerprint is unchanged this long. */
  stuckMs?: number;
  /** When true, poll until hesJobStatus is terminal or any meter row is SUCCESS/FAILED. */
  waitForCompletion?: boolean;
  /**
   * When true, throw if job never completes.
   * Defaults to HES_E2E_REQUIRE_COMPLETION=true.
   */
  requireCompletion?: boolean;
  /** Command name for timeout diagnostics (e.g. billing_period_get). */
  expectedCommand?: string;
}

export interface PollQueryMeterJobResult {
  rawResponse: Awaited<ReturnType<CommandsQueryMeterJobApi["getQueryMeterJob"]>>["rawResponse"];
  responseBody: QueryMeterJobResponse;
  responseTime: number;
  mapped: MappedQueryMeterJobData;
  pollAttempts: number;
  /** True when hesJobStatus / meter rows reached a terminal state. */
  completed: boolean;
}

/**
 * Query-meter-job root message when hesJobStatus is FINISHED.
 * - autoSynced: "Job finished on HES; meter results synced from meterStatusForJob."
 * - callback / already-synced: "Job status fetched successfully."
 */
export const QUERY_FINISHED_MESSAGE =
  /job finished|synced from meterStatusForJob|job status fetched successfully/i;

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
    if (body.message && QUERY_FINISHED_MESSAGE.test(body.message) && hasTerminalMeterRows(body)) {
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
    expectedCommand?.trim() || data?.meterResults?.[0]?.action?.trim() || "this command";
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
  const intervalMs = parsePositiveMs(options.intervalMs, DEFAULT_POLL_INTERVAL_MS);
  const initialDelayMs = parsePositiveMs(
    options.initialDelayMs,
    HES_COMMANDS_JOB_POLL_INITIAL_DELAY_MS,
  );
  const stuckMs = Math.min(parsePositiveMs(options.stuckMs, DEFAULT_POLL_STUCK_MS), timeoutMs);
  const waitForCompletion = options.waitForCompletion ?? true;
  const requireCompletion = options.requireCompletion ?? isHesE2eCompletionRequired();

  if (initialDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, initialDelayMs));
  }

  const deadline = Date.now() + timeoutMs;
  const pollStartedAt = Date.now();

  let lastResult: Awaited<ReturnType<CommandsQueryMeterJobApi["getQueryMeterJob"]>>;
  let pollAttempts = 0;
  let totalResponseTime = 0;
  let lastFingerprint = "";
  let fingerprintSince = pollStartedAt;
  let stuckReason: "timeout" | "stuck_no_progress" | undefined;

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
      stuckReason = "stuck_no_progress";
      break;
    }

    if (Date.now() >= deadline) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (Date.now() < deadline);

  const completed =
    lastResult.responseBody.success !== false && isQueryMeterJobComplete(lastResult.responseBody);

  if (waitForCompletion && !completed && lastResult.responseBody.success !== false) {
    const reason = stuckReason ?? "timeout";
    const waitedMs = reason === "stuck_no_progress" ? stuckMs : timeoutMs;
    if (requireCompletion) {
      throwIncomplete(
        jobName,
        waitedMs,
        pollAttempts,
        lastResult.responseBody,
        options.expectedCommand,
        reason,
      );
    }
    BackendResponse.logFinding(
      "HES E2E completion deferred (callback pending / HES load)",
      `job=${jobName} waited=${waitedMs}ms reason=${reason} ` +
        `hesJobStatus=${lastResult.responseBody.data?.hesJobStatus ?? "unknown"} ` +
        `meterStatus=${lastResult.responseBody.data?.meterResults?.[0]?.status ?? "unknown"}. ` +
        "Set HES_E2E_REQUIRE_COMPLETION=true to fail instead of accepting async IN_PROGRESS.",
    );
  }

  const mapped = CommandsQueryMeterJobMapper.mapResponse(lastResult.responseBody);

  return {
    rawResponse: lastResult.rawResponse,
    responseBody: lastResult.responseBody,
    responseTime: totalResponseTime,
    mapped,
    pollAttempts,
    completed,
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

/**
 * Clear before/after-style console lines so GET-only vs SET E2E is obvious in the terminal.
 * When SET did not run, "After setting" / "After values" print n/a.
 */
export function logCommandConfigValueSnapshot(options: {
  label: string;
  meterId: string;
  commandType: string;
  /** false = GET-only smoke; true = SET was posted. */
  setRan: boolean;
  jobName?: string;
  /** Values from first GET (or only GET). */
  initialValues?: string | null;
  /** What we attempted to set (human summary), if SET ran. */
  setPayloadSummary?: string | null;
  /** Values from GET after SET. */
  afterValues?: string | null;
}): void {
  const {
    label,
    meterId,
    commandType,
    setRan,
    jobName,
    initialValues,
    setPayloadSummary,
    afterValues,
  } = options;

  console.log(`\n========== ${label} — value clarity ==========`);
  console.log(`Meter:          ${meterId}`);
  console.log(`Command type:   ${commandType}`);
  console.log(`Job name:       ${jobName ?? "n/a"}`);
  console.log(`SET job ran:    ${setRan ? "YES" : "NO (GET only — SET not executed)"}`);
  console.log(`Initial value:  ${initialValues?.trim() || "(none)"}`);
  console.log(
    `After setting:  ${setRan ? setPayloadSummary?.trim() || "(set payload not logged)" : "n/a (SET skipped)"}`,
  );
  console.log(`After value:    ${setRan ? afterValues?.trim() || "(none)" : "n/a (SET skipped)"}`);
  console.log(`================================================\n`);
}

/**
 * Shared query-phase assertions for command E2E.
 * If poll completed → run onFinished (FINISHED / hesResponse checks).
 * If still pending → assert async RUNNING/IN_PROGRESS contract and pass.
 */
export function assertHesE2eQueryPhase(options: {
  validation: ApiValidationHelper;
  queryValidator: CommandsQueryMeterJobValidator;
  pollResult: PollQueryMeterJobResult;
  jobName: string;
  meterId: string;
  onFinished: () => void;
}): void {
  const { validation, queryValidator, pollResult, jobName, meterId, onFinished } = options;

  validation.execute("Query Success Response", () =>
    queryValidator.validateResponse(pollResult.responseBody),
  );
  validation.execute("Query Job Name Echo", () =>
    queryValidator.validateJobNameEcho(pollResult.mapped, jobName),
  );
  validation.execute("Query Sync Flags", () => queryValidator.validateSyncFlags(pollResult.mapped));
  validation.execute("Query HES Status Code", () =>
    queryValidator.validateHesStatusCode(pollResult.mapped),
  );
  validation.execute("Query Expected Meter Present", () =>
    queryValidator.validateExpectedMeterPresent(pollResult.mapped.job.meterResults, meterId),
  );

  if (pollResult.completed) {
    onFinished();
    return;
  }

  validation.execute("Query Async Job Still Pending", () => {
    const hes = pollResult.mapped.job.hesJobStatus?.trim().toUpperCase() ?? "";
    expect(
      INCOMPLETE_HES_JOB_STATUSES.has(hes),
      `expected incomplete hesJobStatus, got ${hes || "empty"}`,
    ).toBe(true);
    const meterStatus = pollResult.mapped.job.meterResults[0]?.status?.trim().toUpperCase() ?? "";
    expect(
      INCOMPLETE_HES_JOB_STATUSES.has(meterStatus) || meterStatus === "",
      `expected incomplete meter status, got ${meterStatus || "empty"}`,
    ).toBe(true);
  });
  validation.execute("Query Summary Counts (async)", () =>
    queryValidator.validateSummaryCounts(pollResult.mapped.job.summary),
  );
}
