import { APIRequestContext, APIResponse } from "@playwright/test";
import { BILLING_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const BILLING_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const BILLING_MAX_ATTEMPTS = 5;
const BILLING_RETRY_DELAY_MS = 5_000;

export interface BillingRequestResult {
  response: APIResponse;
  /** Duration of the final HTTP attempt only (excludes retry delays). */
  responseTime: number;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Billing endpoints are slow and occasionally return 500/503 before succeeding.
 * Retries transient server errors; responseTime reflects the last attempt only.
 */
export async function getBillingWithRetry(
  request: APIRequestContext,
  url: string,
): Promise<BillingRequestResult> {
  let lastResponse: APIResponse | undefined;
  let lastAttemptTime = 0;

  for (let attempt = 1; attempt <= BILLING_MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now();
    const response = await getWithAutoRefresh(request, url, {
      timeout: BILLING_REQUEST_TIMEOUT_MS,
    });
    lastAttemptTime = Date.now() - attemptStart;
    lastResponse = response;

    if (!BILLING_RETRY_STATUSES.has(response.status()) || attempt === BILLING_MAX_ATTEMPTS) {
      return { response, responseTime: lastAttemptTime };
    }

    await sleep(BILLING_RETRY_DELAY_MS);
  }

  return { response: lastResponse!, responseTime: lastAttemptTime };
}
