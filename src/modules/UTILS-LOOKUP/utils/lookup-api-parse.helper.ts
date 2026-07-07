import type { APIResponse } from "@playwright/test";

/**
 * =============================================================================
 * BACKEND RESPONSE ISSUES (observed in test runs — not automation/framework bugs)
 * Reference: reports/probe-hierarchy.txt (probe-consumer-lookups, 2026-07-07)
 * =============================================================================
 *
 * This helper only parses JSON. The failures below are caused by the API gateway
 * or service returning non-JSON bodies. Documented so dev can fix server behaviour.
 *
 * -----------------------------------------------------------------------------
 * ISSUE 1 — Rate limit returns plain text (not JSON)
 * -----------------------------------------------------------------------------
 * When:  Serial MASTER-DATA suites hit bulk-upload / lookup endpoints rapidly.
 * HTTP:  429 Too Many Requests
 * Body:  Too many requests, please try again later.
 * Proof: bulk-upload-dtr.spec.ts retry — "POST /indore/master-data/bulk-upload-dtr
 *         returned non-JSON (429): Too many requests, please try again later."
 *         bulk-upload-consumers.api.ts same symptom before client retry was added.
 * Expected: 429 with JSON error envelope { success, error: { code, message } }
 * Impact:   Parser throws; tests fail unless client retries (framework workaround).
 *
 * -----------------------------------------------------------------------------
 * ISSUE 2 — Missing UTILS-LOOKUP routes return HTML 404 (not JSON)
 * -----------------------------------------------------------------------------
 * Consumer Bulk §2 requires Billing Cycle, Connection Type, TOD, Main/Sub Meter
 * dropdowns. Probed paths all return HTML error pages:
 *
 *   GET /indore/utils/connection-types     → 404 Cannot GET /utils/connection-types
 *   GET /indore/utils/billing-cycles       → 404 Cannot GET /utils/billing-cycles
 *   GET /indore/utils/billing-cycle        → 404 Cannot GET /utils/billing-cycle
 *   GET /indore/utils/tods                 → 404 Cannot GET /utils/tods
 *   GET /indore/utils/tod                  → 404 Cannot GET /utils/tod
 *   GET /indore/utils/time-of-day          → 404 Cannot GET /utils/time-of-day
 *   GET /indore/utils/main-sub-meters      → 404 Cannot GET /utils/main-sub-meters
 *   GET /indore/utils/main-sub-meter       → 404 Cannot GET /utils/main-sub-meter
 *
 * Sample body (all missing routes):
 *   <!DOCTYPE html>...<pre>Cannot GET /utils/connection-types</pre>
 *
 * Impact: Automation cannot resolve billing/TOD/main-sub ids from API; env
 *         defaults used (see master-data-env.helper.ts).
 */

export async function parseLookupJsonResponse<T>(
  rawResponse: APIResponse,
  endpointLabel: string,
): Promise<T> {
  const text = await rawResponse.text();
  if (!text.trim()) {
    return { success: false } as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `${endpointLabel} returned non-JSON (${rawResponse.status()}): ${text.slice(0, 120)}`,
    );
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
