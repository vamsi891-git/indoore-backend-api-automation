import { test, expect } from "@playwright/test";
import { RetryEngine } from "../engine/retry.engine";
import {
  computeBackoffMs,
  HTTP_MAX_RETRY_ATTEMPTS,
  HTTP_RETRY_COUNT,
  isRetryableHttpStatus,
  isTransientNetworkError,
  parseRetryAfterMs,
} from "../engine/http-retry.policy";

test.describe("http-retry.policy", () => {
  test("retries on 429 and 503 only", () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(502)).toBe(true);
    expect(isRetryableHttpStatus(504)).toBe(true);
  });

  test("detects transient network errors", () => {
    expect(isTransientNetworkError(new Error("read ECONNRESET"))).toBe(true);
    expect(isTransientNetworkError(new Error("socket hang up"))).toBe(true);
    expect(isTransientNetworkError(new Error("Timeout 90000ms exceeded"))).toBe(false);
  });

  test("does not retry 400, 404, or 500", () => {
    expect(isRetryableHttpStatus(400)).toBe(false);
    expect(isRetryableHttpStatus(404)).toBe(false);
    expect(isRetryableHttpStatus(500)).toBe(false);
    expect(isRetryableHttpStatus(401)).toBe(false);
  });

  test("honors Retry-After seconds and HTTP-date", () => {
    expect(parseRetryAfterMs("2")).toBe(2_000);
    expect(parseRetryAfterMs("120")).toBe(30_000);
    const now = Date.parse("Wed, 21 Oct 2015 07:28:00 GMT");
    expect(parseRetryAfterMs("Wed, 21 Oct 2015 07:28:05 GMT", now)).toBe(5_000);
  });

  test("exponential backoff is capped and Retry-After wins when larger", () => {
    expect(computeBackoffMs(1)).toBe(1_000);
    expect(computeBackoffMs(2)).toBe(2_000);
    expect(computeBackoffMs(3)).toBe(4_000);
    expect(computeBackoffMs(4)).toBe(8_000);
    expect(computeBackoffMs(8)).toBe(8_000);
    expect(computeBackoffMs(1, 5_000)).toBe(5_000);
  });
});

function retryIfRetryableStatus(row?: { status: number }): boolean {
  return row != null && isRetryableHttpStatus(row.status);
}

test.describe("RetryEngine HTTP policy", () => {
  test("retries 429 then succeeds", async () => {
    const statuses = [429, 200];
    let calls = 0;
    const result = await RetryEngine.execute(
      async () => {
        const status = statuses[calls] ?? 200;
        calls += 1;
        return { status };
      },
      retryIfRetryableStatus,
      { retries: HTTP_RETRY_COUNT, delayMs: 0, label: "GET /retry-429" },
    );
    expect(calls).toBe(2);
    expect(result.status).toBe(200);
  });

  test("retries 503 then succeeds", async () => {
    const statuses = [503, 503, 200];
    let calls = 0;
    const result = await RetryEngine.execute(
      async () => {
        const status = statuses[calls] ?? 200;
        calls += 1;
        return { status };
      },
      retryIfRetryableStatus,
      { retries: HTTP_RETRY_COUNT, delayMs: 0, label: "GET /retry-503" },
    );
    expect(calls).toBe(3);
    expect(result.status).toBe(200);
  });

  test("does not retry 400 or 404", async () => {
    for (const status of [400, 404]) {
      let calls = 0;
      const result = await RetryEngine.execute(
        async () => {
          calls += 1;
          return { status };
        },
        retryIfRetryableStatus,
        { retries: HTTP_RETRY_COUNT, delayMs: 0, label: `GET /no-retry-${status}` },
      );
      expect(calls).toBe(1);
      expect(result.status).toBe(status);
    }
  });

  test("stops at max attempts on persistent 503", async () => {
    let calls = 0;
    const result = await RetryEngine.execute(
      async () => {
        calls += 1;
        return { status: 503 };
      },
      retryIfRetryableStatus,
      { retries: HTTP_RETRY_COUNT, delayMs: 0, label: "GET /max" },
    );
    expect(calls).toBe(HTTP_MAX_RETRY_ATTEMPTS);
    expect(result.status).toBe(503);
  });

  test("delayMs uses Retry-After from the failed attempt", async () => {
    const waits: number[] = [];
    await RetryEngine.execute(
      async () => ({ status: 429, retryAfter: "3" }),
      (row, error) => {
        if (error != null) {
          return false;
        }
        return retryIfRetryableStatus(row);
      },
      {
        retries: 1,
        delayMs: (failedAttempt, result) => {
          const wait = computeBackoffMs(failedAttempt, parseRetryAfterMs(result?.retryAfter));
          waits.push(wait);
          return 0;
        },
        label: "GET /retry-after",
      },
    );
    expect(waits[0]).toBe(3_000);
  });
});
