/**
 * OPTIONAL SUBSYSTEMS — not required for default GET / @smoke runs.
 *
 * Import from here only in:
 * - `@db` specs and module Db folders
 * - `@contract-snapshot` specs
 * - `@mutation-proof` specs
 * - `fixtures/api-db.fixture.ts` / `fixtures/observability.fixture.ts`
 * - defect report path (lazy-loaded from ValidationEngine on failure)
 *
 * Perf metrics stay under `src/core/utils/` (used by many GET specs) but no-op
 * when `OBS_DISABLED=1`.
 */

export const EXTRAS_PACKAGES = [
  {
    id: "db",
    path: "src/extras/db",
    purpose: "Read-only Postgres compare for @db tests",
    entry: ["postgres.client.ts", "db-compare.engine.ts"],
    requires: "DB_HOST, DB_USER, DB_PASSWORD, DB_NAME",
  },
  {
    id: "contract",
    path: "src/extras/contract",
    purpose: "Column/header contract snapshots",
    entry: ["contract-snapshot.helper.ts"],
    requires: "none (UPDATE_CONTRACT_SNAPSHOTS to refresh)",
  },
  {
    id: "ai",
    path: "src/extras/ai",
    purpose: "Heuristic + optional LLM defect triage",
    entry: ["defect-heuristic-triage.ts", "defect-llm-triage.ts", "defect-triage.types.ts"],
    requires: "DEFECT_LLM_ENABLED + DEFECT_LLM_API_KEY (optional)",
  },
  {
    id: "observability",
    path: "src/extras/observability",
    purpose: "JSONL run traces (opt-in fixture)",
    entry: ["logger.ts", "context.ts", "types.ts", "query.ts"],
    requires: "OBS_DISABLED=0 (default on); set OBS_DISABLED=1 to silence",
  },
] as const;

/** Documented but kept in core (too many default-spec call sites). */
export const CORE_OPTIONAL = [
  {
    id: "performance",
    path: "src/core/utils/performance.tracker.ts",
    purpose: "DNS/connection timing printout after GET",
    note: "No-op when OBS_DISABLED=1",
  },
  {
    id: "network-metric",
    path: "src/core/utils/network.metric.ts",
    purpose: "HEAD probe for DNS/connect timings",
    note: "Only used by PerformanceTracker",
  },
] as const;
