/**
 * HTTP retry policy for GET (owned by TimedApiClient).
 * Retry only 429 and gateway 502/503/504. Never retry other 4xx or 5xx.
 * Also retry transient socket drops (ECONNRESET / hang-up) on GET only.
 */
export const HTTP_RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

/** First try + this many retries. */
export const HTTP_MAX_RETRY_ATTEMPTS = 4;
export const HTTP_RETRY_COUNT = HTTP_MAX_RETRY_ATTEMPTS - 1;

const BACKOFF_BASE_MS = 1_000;
const BACKOFF_CAP_MS = 8_000;
const RETRY_AFTER_CAP_MS = 30_000;

export function isRetryableHttpStatus(status: number): boolean {
  return HTTP_RETRYABLE_STATUSES.has(status);
}

/** Connection drops before an HTTP status — retry GET only via TimedApiClient. */
export function isTransientNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ECONNABORTED|ECONNREFUSED|ETIMEDOUT|EPIPE|socket hang up/i.test(message);
}

export function parseRetryAfterMs(
  header: string | undefined,
  nowMs: number = Date.now(),
): number | undefined {
  if (header == null) {
    return undefined;
  }
  const trimmed = header.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.min(RETRY_AFTER_CAP_MS, Number(trimmed) * 1_000);
  }
  const until = Date.parse(trimmed);
  if (Number.isNaN(until)) {
    return undefined;
  }
  return Math.min(RETRY_AFTER_CAP_MS, Math.max(0, until - nowMs));
}

export function computeBackoffMs(failedAttempt: number, retryAfterMs?: number): number {
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, failedAttempt - 1));
  if (retryAfterMs == null) {
    return exp;
  }
  return Math.min(RETRY_AFTER_CAP_MS, Math.max(exp, retryAfterMs));
}
