/**
 * Structured observability event types.
 *
 * Every layer of the framework (contract/schema checks, DB cross-validation,
 * retry wrappers, CI routing, test teardown) appends one of these events to a
 * shared append-only log keyed by `runId` + `testId`. See `logger.ts` for the
 * writer and `query.ts` for trace reconstruction.
 */

export type EventOutcome = "pass" | "fail" | "warn";

export type EventKind =
  | "ci_routing"
  | "contract"
  | "db_cross_validation"
  | "retry"
  | "test_outcome";

/** Fields shared by every event so traces can be keyed and ordered. */
export interface BaseEvent {
  /** One id per test run (crypto.randomUUID), threaded from global setup. */
  runId: string;
  /** Per-test identity. Currently the Playwright test title. */
  testId: string;
  /** Owning module slug/name (e.g. "REPORTS" / "dtr-billing"). */
  module: string;
  /** ISO-8601 timestamp; filled by the logger when omitted. */
  timestamp: string;
  /** Coarse pass/fail/warn for quick scanning. */
  outcome: EventOutcome;
}

/** Emitted after each ValidationEngine / Zod schema check. */
export interface ContractEvent extends BaseEvent {
  kind: "contract";
  /** Human-readable check name (e.g. "Status Validation", "Schema Parse"). */
  check: string;
  /** Which field diverged, when known. */
  field?: string;
  expected?: unknown;
  actual?: unknown;
  /** First line of the failure message, when failing. */
  message?: string;
}

/** Emitted for each API-vs-DB field comparison. */
export interface DbCrossValidationEvent extends BaseEvent {
  kind: "db_cross_validation";
  table?: string;
  column?: string;
  /** Comparison label (e.g. "Pagination total"). */
  label?: string;
  /** DB side of the comparison. */
  expected?: unknown;
  /** API side of the comparison. */
  actual?: unknown;
  /** Comparison mode used (exact / lte / tolerance). */
  mode?: string;
  message?: string;
}

/** Emitted once per retry attempt in a retry wrapper. */
export interface RetryEvent extends BaseEvent {
  kind: "retry";
  /** Which retry layer fired (e.g. "http", "db-pool"). */
  layer: string;
  /** 1-based attempt number. */
  attempt: number;
  maxAttempts?: number;
  /** Why the retry happened (status code, error code, pool-exhaustion, ...). */
  reason: string;
  /** Whether this attempt ultimately succeeded. */
  succeeded: boolean;
  /** The thing being retried (request path, query label, ...). */
  target?: string;
}

/** Emitted once per test run, before tests start, from a CI setup script. */
export interface CiRoutingEvent extends BaseEvent {
  kind: "ci_routing";
  /** GITHUB_EVENT_NAME: push / pull_request / workflow_dispatch / local. */
  trigger: string;
  /** Whether this was a targeted (changed-modules) or full-regression run. */
  runType: "targeted" | "full-regression" | "unknown";
  /** Detector reason / matched routing rule. */
  matchedRule?: string;
  /** Modules selected to run. */
  modules?: string[];
  branch?: string;
  sha?: string;
  workflow?: string;
  runUrl?: string;
}

/** Emitted in test teardown with the final result. */
export interface TestOutcomeEvent extends BaseEvent {
  kind: "test_outcome";
  durationMs: number;
  /** Playwright status. */
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  error?: string;
  title?: string;
  tags?: string[];
}

export type ObservabilityEvent =
  | ContractEvent
  | DbCrossValidationEvent
  | RetryEvent
  | CiRoutingEvent
  | TestOutcomeEvent;

/**
 * Event as supplied by callers — `timestamp` is optional (the logger fills it).
 * Keeps call sites terse while guaranteeing a timestamp on disk.
 */
export type EventInput =
  | (Omit<ContractEvent, "timestamp"> & { timestamp?: string })
  | (Omit<DbCrossValidationEvent, "timestamp"> & { timestamp?: string })
  | (Omit<RetryEvent, "timestamp"> & { timestamp?: string })
  | (Omit<CiRoutingEvent, "timestamp"> & { timestamp?: string })
  | (Omit<TestOutcomeEvent, "timestamp"> & { timestamp?: string });

/** Deterministic ordering for trace reconstruction. */
export const KIND_ORDER: Record<EventKind, number> = {
  ci_routing: 0,
  contract: 1,
  db_cross_validation: 2,
  retry: 3,
  test_outcome: 4,
};
