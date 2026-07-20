/**
 * Offline verification harness for the observability substrate.
 *
 * Drives the REAL instrumented modules (ValidationEngine, compareApiToDb) under
 * an ambient context so their appendEvent() wiring produces events exactly as
 * they would during a dtr-billing test. Retry + outcome events are emitted via
 * the same appendEvent() the layer wrappers use. Lets us validate trace
 * reconstruction without a live backend (used when the API is unavailable).
 *
 * Run: ts-node --compilerOptions '{"module":"commonjs"}' scripts/observability-verify.ts
 */

import { setCurrentContext } from "../src/observability/context";
import { appendEvent } from "../src/observability/logger";
import { ValidationEngine } from "../src/core/engine/validation.engine";
import { compareApiToDb } from "../src/core/db/db-compare.engine";
import process from "process";

const runId = process.env.OBS_RUN_ID ?? "local-verify-002";
const obs = {
  runId,
  testId: "Validate DTR Billing Report API — live primary range",
  module: "REPORTS",
};

setCurrentContext(obs);

// 1) Contract events via the REAL ValidationEngine (per-check emit).
const validation = new ValidationEngine(obs);
validation.execute("Status Validation", () => {
  /* passes */
});
validation.execute("Response Time", () => {
  /* passes */
});
validation.recordContract({
  check: "Schema Parse",
  outcome: "fail",
  field: "data.rows[0].mf",
  expected: "number",
  actual: "string",
  message: "Expected number, received string",
});

// 2) DB cross-validation via the REAL compare engine (asserts on mismatch).
try {
  compareApiToDb(
    [{ label: "meterSerialNumber", apiValue: "MTR-1001", dbValue: "MTR-1001" }],
    "DB vs API — DTR billing meter header",
    { ...obs, table: "L_Meter_Lookup", column: "Meter_Serial_Number", mode: "exact" },
  );
} catch {
  /* comparison assertion irrelevant here; we only care about the emitted event */
}

// 3) Retry events — identical shape to timed-api.client / postgres.client emitters.
appendEvent({
  kind: "retry",
  ...obs,
  outcome: "warn",
  layer: "db-pool",
  attempt: 1,
  maxAttempts: 3,
  reason: "too many clients already (pool exhaustion)",
  succeeded: false,
  target: "pg.query",
});
appendEvent({
  kind: "retry",
  ...obs,
  outcome: "pass",
  layer: "db-pool",
  attempt: 2,
  maxAttempts: 3,
  reason: "recovered after transient error",
  succeeded: true,
  target: "pg.query",
});

// 4) Test outcome — identical to observability.fixture teardown.
appendEvent({
  kind: "test_outcome",
  ...obs,
  outcome: "fail",
  durationMs: 812,
  status: "failed",
  error: "1 validation(s) failed: Schema Parse",
  title: obs.testId,
  tags: ["@dtr-billing", "@smoke"],
});

console.log(`Verification events written for runId=${runId}`);
