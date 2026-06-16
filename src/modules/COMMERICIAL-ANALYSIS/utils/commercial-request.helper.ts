import { APIRequestContext, APIResponse } from "@playwright/test";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const COMMERCIAL_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const COMMERCIAL_MAX_ATTEMPTS = 5;
const COMMERCIAL_RETRY_DELAY_MS = 5_000;
const SUMMARY_MAX_ATTEMPTS = 10;
const SUMMARY_RETRY_DELAY_MS = 10_000;

export interface CommercialRequestResult {
  response: APIResponse;
  responseTime: number;
}

export interface CommercialRetryConfig {
  maxAttempts?: number;
  retryDelayMs?: number;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCommercialWithRetry(
  request: APIRequestContext,
  url: string,
  options?: Parameters<typeof getWithAutoRefresh>[2],
  retryConfig?: CommercialRetryConfig,
): Promise<CommercialRequestResult> {
  const maxAttempts = retryConfig?.maxAttempts ?? COMMERCIAL_MAX_ATTEMPTS;
  const retryDelayMs = retryConfig?.retryDelayMs ?? COMMERCIAL_RETRY_DELAY_MS;
  let lastResponse: APIResponse | undefined;
  let lastAttemptTime = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStart = Date.now();
    const response = await getWithAutoRefresh(request, url, {
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
      ...options,
    });
    lastAttemptTime = Date.now() - attemptStart;
    lastResponse = response;

    if (
      !COMMERCIAL_RETRY_STATUSES.has(response.status()) ||
      attempt === maxAttempts
    ) {
      return { response, responseTime: lastAttemptTime };
    }

    await sleep(retryDelayMs);
  }

  return { response: lastResponse!, responseTime: lastAttemptTime };
}

/** Summary aggregates all reports and is slower / more prone to transient 500s. */
export function getCommercialSummaryWithRetry(
  request: APIRequestContext,
  url: string,
  options?: Parameters<typeof getWithAutoRefresh>[2],
): Promise<CommercialRequestResult> {
  return getCommercialWithRetry(request, url, options, {
    maxAttempts: SUMMARY_MAX_ATTEMPTS,
    retryDelayMs: SUMMARY_RETRY_DELAY_MS,
  });
}
