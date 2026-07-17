import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  CONSUMPTION_REQUEST_TIMEOUT_MS,
  MIS_SLOW_REQUEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

const COMMERCIAL_RETRY_STATUSES = new Set([500, 502, 503, 504]);
const COMMERCIAL_MAX_ATTEMPTS = 5;
const COMMERCIAL_RETRY_DELAY_MS = 5_000;
const SUMMARY_MAX_ATTEMPTS = 6;
const SUMMARY_BASE_RETRY_DELAY_MS = 5_000;

export interface CommercialRequestResult {
  response: APIResponse;
  responseTime: number;
  attempts: number;
}

export interface CommercialRetryConfig {
  maxAttempts?: number;
  retryDelayMs?: number;
  /** When true, delay grows as base * attempt (capped). */
  exponentialBackoff?: boolean;
  timeoutMs?: number;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function nextDelayMs(
  attempt: number,
  baseDelayMs: number,
  exponential: boolean,
): number {
  if (!exponential) return baseDelayMs;
  return Math.min(baseDelayMs * attempt, 45_000);
}

export async function getCommercialWithRetry(
  request: APIRequestContext,
  url: string,
  options?: Parameters<typeof getWithAutoRefresh>[2],
  retryConfig?: CommercialRetryConfig,
): Promise<CommercialRequestResult> {
  const maxAttempts = retryConfig?.maxAttempts ?? COMMERCIAL_MAX_ATTEMPTS;
  const retryDelayMs = retryConfig?.retryDelayMs ?? COMMERCIAL_RETRY_DELAY_MS;
  const exponential = retryConfig?.exponentialBackoff ?? false;
  const timeoutMs = retryConfig?.timeoutMs ?? MIS_SLOW_REQUEST_TIMEOUT_MS;
  let lastResponse: APIResponse | undefined;
  let lastAttemptTime = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStart = Date.now();
    const response = await getWithAutoRefresh(request, url, {
      timeout: timeoutMs,
      ...options,
    });
    lastAttemptTime = Date.now() - attemptStart;
    lastResponse = response;
    if (
      !COMMERCIAL_RETRY_STATUSES.has(response.status()) ||
      attempt === maxAttempts
    ) {
      return {
        response,
        responseTime: lastAttemptTime,
        attempts: attempt,
      };
    }

    await sleep(nextDelayMs(attempt, retryDelayMs, exponential));
  }

  return {
    response: lastResponse!,
    responseTime: lastAttemptTime,
    attempts: maxAttempts,
  };
}

/** Summary aggregates all reports — slower and more prone to transient 500s. */
export function getCommercialSummaryWithRetry(
  request: APIRequestContext,
  url: string,
  options?: Parameters<typeof getWithAutoRefresh>[2],
): Promise<CommercialRequestResult> {
  return getCommercialWithRetry(request, url, options, {
    maxAttempts: SUMMARY_MAX_ATTEMPTS,
    retryDelayMs: SUMMARY_BASE_RETRY_DELAY_MS,
    exponentialBackoff: true,
    timeoutMs: CONSUMPTION_REQUEST_TIMEOUT_MS,
  });
}

export function isCommercialTransientError(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const err = (body as { error?: { code?: string } }).error;
  return err?.code === "INTERNAL_ERROR";
}
