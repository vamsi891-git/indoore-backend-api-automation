export const DEFAULT_REQUEST_TIMEOUT_MS = 90_000;
export const MASTER_DATA_REQUEST_TIMEOUT_MS = 240_000;
export const MASTER_DATA_TEST_TIMEOUT_MS = 480_000;
export const MASTER_DATA_MAX_RESPONSE_TIME_MS = 240_000;
export const MIS_SLOW_REQUEST_TIMEOUT_MS = 120_000;
export const BILLING_REQUEST_TIMEOUT_MS = 180_000;
export const BILLING_MAX_RESPONSE_TIME_MS = 240_000;
export const BILLING_TEST_TIMEOUT_MS = 600_000;
export const CONSUMPTION_REQUEST_TIMEOUT_MS = 360_000;
export const CONSUMPTION_MAX_RESPONSE_TIME_MS = 360_000;
export const CONSUMPTION_TEST_TIMEOUT_MS = 600_000;
/** GET /indore/dtr-load pages archive LS/DP/TP — DISTINCT + hourly AVG is slow. */
export const DTR_LOAD_REQUEST_TIMEOUT_MS = 360_000;
export const DTR_LOAD_MAX_RESPONSE_TIME_MS = 360_000;
export const DTR_LOAD_TEST_TIMEOUT_MS = 600_000;
export const DEFAULT_TEST_TIMEOUT_MS = 240_000;
/**
 * Cap how long E2E waits for HES callback. Healthy jobs usually finish well under this;
 * stuck RUNNING/IN_PROGRESS soft-skips instead of burning 6+ minutes.
 * Override with JOB_POLL_TIMEOUT_MS when HES is known slow but healthy.
 */
export const HES_COMMANDS_JOB_POLL_TIMEOUT_MS = 120_000;
export const HES_COMMANDS_JOB_POLL_INTERVAL_MS = 3_000;
export const HES_COMMANDS_JOB_POLL_INITIAL_DELAY_MS = 2_000;
/**
 * Soft-skip earlier when hesJobStatus + meterStatus never change (callback clearly pending).
 * Override with JOB_POLL_STUCK_MS. Must be <= JOB_POLL_TIMEOUT_MS to take effect.
 */
export const HES_COMMANDS_JOB_POLL_STUCK_MS = 90_000;
/** Minimum gap between HES job POSTs when tests share one meter (ms). */
export const HES_COMMANDS_JOB_MIN_GAP_MS = 10_000;
/** Poll window + init POST + validation buffer for @e2e command specs. */
export const HES_COMMANDS_E2E_TEST_TIMEOUT_MS = 240_000;
export const HES_COMMANDS_PAYMENT_TEST_TIMEOUT_MS = HES_COMMANDS_E2E_TEST_TIMEOUT_MS;
export const TECHNICAL_ANALYSIS_REQUEST_TIMEOUT_MS = 120_000;
export const TECHNICAL_ANALYSIS_MAX_RESPONSE_TIME_MS = 120_000;
/** Phase grid reports are wide (daily kWh columns) and often exceed 120s. */
export const TECHNICAL_ANALYSIS_PHASE_REQUEST_TIMEOUT_MS = 240_000;
export const TECHNICAL_ANALYSIS_PHASE_MAX_RESPONSE_TIME_MS = 240_000;
export const TECHNICAL_ANALYSIS_PHASE_PAGE_SIZE = 25;
export const TECHNICAL_ANALYSIS_TEST_TIMEOUT_MS = 600_000;
export const ASSET_MANAGEMENT_HIERARCHY_REQUEST_TIMEOUT_MS = 180_000;
export const ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS = 900_000;
/** Dashboard DB harness fans out many archive/details probes in one run. */
export const DASHBOARD_DB_COVERAGE_TEST_TIMEOUT_MS = 900_000;
/** Commercial summary + drilldown APIs are slow; one harness covers all families. */
export const COMMERCIAL_ANALYSIS_DB_COVERAGE_TEST_TIMEOUT_MS = 900_000;
export const UTILS_LOOKUP_REQUEST_TIMEOUT_MS = 90_000;
export const UTILS_LOOKUP_MAX_RESPONSE_TIME_MS = 60_000;
export const UTILS_LOOKUP_TEST_TIMEOUT_MS = 180_000;
/** Revenue Protection aberration grids run heavy raw-SQL aggregations (90s DB timeout). */
export const REVENUE_PROTECTION_REQUEST_TIMEOUT_MS = 120_000;
export const REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS = 120_000;
export const REVENUE_PROTECTION_TEST_TIMEOUT_MS = 300_000;
