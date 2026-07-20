import { APIRequestContext, APIResponse } from "@playwright/test";
import { REVENUE_PROTECTION_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 6;
const RETRY_DELAY_MS = 5_000;
const RATE_LIMIT_BASE_DELAY_MS = 10_000;

type RequestOptions = Parameters<typeof getWithAutoRefresh>[2];

export interface RevenueProtectionRequestResult {
  response: APIResponse;
  /** Total wall-clock across all attempts, including retry backoff. */
  responseTime: number;
}

function isTransientNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|socket hang up|EPIPE/i.test(message);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveRetryDelayMs(response: APIResponse | undefined, attempt: number): number {
  if (response?.status() === 429) {
    const retryAfter = response.headers()["retry-after"];
    const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.ceil(retryAfterSeconds * 1000);
    }
    return RATE_LIMIT_BASE_DELAY_MS * attempt;
  }
  return RETRY_DELAY_MS * attempt;
}

/**
 * Generic request retry for transient statuses (429/5xx) and network blips.
 * Use for unauthenticated auth probes and non-GET method checks.
 */
export async function requestRevenueProtectionWithRetry(
  execute: () => Promise<APIResponse>,
): Promise<APIResponse> {
  let lastResponse: APIResponse | undefined;
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      lastResponse = await execute();
      if (
        !RETRY_STATUSES.has(lastResponse.status()) ||
        attempt === MAX_ATTEMPTS
      ) {
        return lastResponse;
      }
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
    }
    await sleep(resolveRetryDelayMs(lastResponse, attempt));
  }
  if (lastResponse) {
    return lastResponse;
  }
  throw lastError;
}

/**
 * Authenticated GET with retries for transient statuses (429/5xx) and
 * network blips. Prefer this over raw authenticatedApi.get for RP specs
 * that fire many requests in a short window (negative suites).
 */
export async function getRevenueProtectionWithRetry(
  request: APIRequestContext,
  url: string,
  options: RequestOptions = {},
): Promise<RevenueProtectionRequestResult> {
  const start = Date.now();
  const response = await requestRevenueProtectionWithRetry(() =>
    getWithAutoRefresh(request, url, {
      timeout: REVENUE_PROTECTION_REQUEST_TIMEOUT_MS,
      ...options,
    }),
  );
  return { response, responseTime: Date.now() - start };
}

/** Build a path+query URL from a path and string/number param map. */
export function buildRevenueProtectionUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
