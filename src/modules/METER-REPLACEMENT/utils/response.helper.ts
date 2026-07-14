import { APIResponse } from "@playwright/test";

export async function safeResponseJson<T = Record<string, unknown>>(
  response: APIResponse,
): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      success: false,
      message: text.slice(0, 200),
      nonJson: true,
    } as T;
  }
}

export function encodePathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

export async function pauseMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimited(response: APIResponse): boolean {
  if (response.status() === 429) {
    return true;
  }

  const retryAfter = response.headers()["retry-after"];
  return Boolean(retryAfter && response.status() >= 400);
}

/**
 * Retries the request when the API returns HTTP 429 (rate limit).
 * Used across Meter Replacement API clients and negative auth/method probes.
 */
export async function withRateLimitRetry(
  requestFn: () => Promise<APIResponse>,
  options?: {
    maxAttempts?: number;
    baseDelayMs?: number;
  },
): Promise<APIResponse> {
  const maxAttempts = options?.maxAttempts ?? 10;
  const baseDelayMs = options?.baseDelayMs ?? 4_000;

  let lastResponse: APIResponse | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResponse = await requestFn();

    if (!isRateLimited(lastResponse)) {
      return lastResponse;
    }

    if (attempt === maxAttempts) {
      break;
    }

    const retryAfterHeader = lastResponse.headers()["retry-after"];
    const retryAfterMs = retryAfterHeader
      ? Number(retryAfterHeader) * 1_000
      : NaN;
    const delayMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0
      ? Math.max(retryAfterMs, baseDelayMs)
      : baseDelayMs * attempt;

    await pauseMs(delayMs);
  }

  return lastResponse as APIResponse;
}
