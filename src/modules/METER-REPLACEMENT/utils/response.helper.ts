import type { APIResponse } from "@playwright/test";
import { BackendResponse } from "../../../core/utils/backend-response.util";

const DEFAULT_RETRY_DELAY_MS = 800;
const DEFAULT_MAX_RETRIES = 5;
const MAX_BACKOFF_DELAY_MS = 8_000;

/**
 * Reads a `Retry-After` header (seconds, or an HTTP date) off a 429 response.
 * Returns null when absent/unparseable so callers fall back to backoff.
 */
function getRetryAfterMs(result: unknown): number | null {
  if (
    !result ||
    typeof result !== "object" ||
    !("headers" in result) ||
    typeof (result as { headers?: unknown }).headers !== "function"
  ) {
    return null;
  }
  try {
    const headers = (result as { headers: () => Record<string, string> }).headers();
    const raw = headers?.["retry-after"];
    if (!raw) return null;
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const dateMs = Date.parse(raw);
    if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  } catch {
    // Ignore malformed headers and fall back to backoff.
  }
  return null;
}

/** Exponential backoff with jitter, capped at MAX_BACKOFF_DELAY_MS. */
function backoffDelay(baseDelayMs: number, attempt: number): number {
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exponential + jitter, MAX_BACKOFF_DELAY_MS);
}

/**
 * Retry an async function with rate limit handling.
 * Uses exponential backoff with jitter between attempts, and honors a
 * `Retry-After` header when the API sends one, so bursts of requests
 * (e.g. probing many candidates or looping over negative test cases)
 * don't keep tripping the same rate-limit window.
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retries on 429 (default: 5)
 * @param delayMs - Base delay between retries in milliseconds (default: 800)
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxRetries = DEFAULT_MAX_RETRIES,
  delayMs = DEFAULT_RETRY_DELAY_MS,
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Check if result is an APIResponse with rate limit status
      if (
        result &&
        typeof result === "object" &&
        "status" in result &&
        typeof result.status === "function"
      ) {
        const status = result.status();
        
        // If rate limited and we have retries left, wait and retry
        if (status === 429 && attempt < maxRetries) {
          const wait = getRetryAfterMs(result) ?? backoffDelay(delayMs, attempt);
          BackendResponse.logFinding(
            "Rate limit hit",
            `429 on attempt ${attempt + 1}, waiting ${Math.round(wait)}ms`,
          );
          await pauseMs(wait);
          continue;
        }
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If it's a timeout/connection error and we have retries left, retry
      if (
        attempt < maxRetries &&
        BackendResponse.isRequestTimeoutError(error)
      ) {
        await pauseMs(backoffDelay(delayMs, attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

/**
 * Safely parse response JSON, returning empty object on failure
 */
export async function safeResponseJson<T = unknown>(
  response: APIResponse,
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

/**
 * Pause execution for specified milliseconds
 */
export function pauseMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * URL encode a path segment
 */
export function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}