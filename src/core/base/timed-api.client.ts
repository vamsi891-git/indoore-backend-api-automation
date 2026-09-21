import { APIRequestContext, APIResponse } from "@playwright/test";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../constants/api-timeouts";
import { ApiCallResult } from "../models/api-result.model";
import { RetryEngine } from "../engine/retry.engine";
import { LoggerEngine } from "../engine/logger.engine";
import {
  computeBackoffMs,
  HTTP_RETRY_COUNT,
  isRetryableHttpStatus,
  parseRetryAfterMs,
} from "../engine/http-retry.policy";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RequestOptions = NonNullable<Parameters<APIRequestContext["get"]>[1]>;

type AttemptResult = {
  rawResponse: APIResponse;
  text: string;
};

async function noteRetry(detail: {
  method: string;
  url: string;
  status: number;
  attempt: number;
}): Promise<void> {
  const line = `${detail.method} ${detail.url} status=${detail.status} attempt=${detail.attempt}`;
  LoggerEngine.warn(`[retry] ${line}`);
  try {
    const { attachment } = await import("allure-js-commons");
    await attachment("retried", line, "text/plain");
  } catch {
    // Unit tests and non-Allure runs still retry; the note is best-effort.
  }
}

export class TimedApiClient {
  constructor(protected readonly authenticatedApi: APIRequestContext) {}

  protected getJson<T = any>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("GET", path, options);
  }

  protected postJson<T = any>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("POST", path, options);
  }

  protected putJson<T = any>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("PUT", path, options);
  }

  protected patchJson<T = any>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("PATCH", path, options);
  }

  protected deleteJson<T = any>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("DELETE", path, options);
  }

  /**
   * GET retries live only here (429, 502, 503, 504). POST/PUT/PATCH/DELETE
   * do not retry — writes are skipped on production and must not hide 5xx.
   */
  protected async requestJson<T = any>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiCallResult<T>> {
    const requestOptions = { timeout: DEFAULT_REQUEST_TIMEOUT_MS, ...options };
    const start = Date.now();
    const label = `${method} ${path}`;

    const runOnce = async (): Promise<AttemptResult> => {
      const rawResponse = await this.dispatch(method, path, requestOptions);
      const text = await rawResponse.text();
      return { rawResponse, text };
    };

    let last: AttemptResult;
    if (method === "GET") {
      last = await RetryEngine.execute(
        async () => runOnce(),
        (result): boolean => result != null && isRetryableHttpStatus(result.rawResponse.status()),
        {
          retries: HTTP_RETRY_COUNT,
          label,
          delayMs: (failedAttempt, result) => {
            const retryAfter = parseRetryAfterMs(result?.rawResponse.headers()["retry-after"]);
            return computeBackoffMs(failedAttempt, retryAfter);
          },
          onRetry: async ({ failedAttempt, result }) => {
            await noteRetry({
              method,
              url: path,
              status: result?.rawResponse.status() ?? 0,
              attempt: failedAttempt,
            });
          },
        },
      );
    } else {
      last = await runOnce();
    }

    let responseBody: T;
    if (!last.text) {
      responseBody = null as T;
    } else {
      try {
        responseBody = JSON.parse(last.text) as T;
      } catch {
        throw new Error(
          `${label} returned non-JSON (${last.rawResponse.status()}): ${last.text.slice(0, 200)}`,
        );
      }
    }
    return {
      rawResponse: last.rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }

  private dispatch(
    method: HttpMethod,
    path: string,
    options: RequestOptions,
  ): Promise<APIResponse> {
    switch (method) {
      case "GET":
        return this.authenticatedApi.get(path, options);
      case "POST":
        return this.authenticatedApi.post(path, options);
      case "PUT":
        return this.authenticatedApi.put(path, options);
      case "PATCH":
        return this.authenticatedApi.patch(path, options);
      case "DELETE":
        return this.authenticatedApi.delete(path, options);
    }
  }
}
