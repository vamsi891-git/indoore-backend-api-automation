import { APIRequestContext, APIResponse } from "@playwright/test";
import { RetryEngine } from "../engine/retry.engine";
import { LoggerEngine } from "../engine/logger.engine";
import { TokenManager } from "./token-manager";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../constants/api-timeouts";
import { resolveApiPath } from "./api-path.util";

type RequestOptions = Omit<
  NonNullable<Parameters<APIRequestContext["fetch"]>[1]>,
  "method" | "headers"
> & {
  headers?: Record<string, string>;
};

/**
 * GET retries are owned by TimedApiClient (429 / 502 / 503 / 504 only).
 * Non-GET still retries gateway statuses here because skipped write specs
 * and CSRF refresh can hit 502/503/504 without going through TimedApiClient.getJson.
 */
const WRITE_RETRYABLE_STATUSES = new Set([502, 503, 504]);
const WRITE_RETRIES = 1;
const WRITE_RETRY_DELAY_MS = 2000;

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function buildHeaders(
  token: string,
  incoming: Record<string, string> | undefined,
  csrfToken: string | undefined,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
): Record<string, string> {
  const headers: Record<string, string> = {
    ...(incoming ?? {}),
    Authorization: `Bearer ${token}`,
    Accept: incoming?.Accept ?? "application/json",
  };

  if (MUTATING_METHODS.has(method) && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
    headers.Cookie = incoming?.Cookie
      ? `${incoming.Cookie}; csrf_token=${csrfToken}`
      : `csrf_token=${csrfToken}`;
  }

  return headers;
}

function normalizeOptions(options: RequestOptions): RequestOptions {
  return {
    timeout: DEFAULT_REQUEST_TIMEOUT_MS,
    ...options,
  };
}

function isNonRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Timeout") ||
    message.includes("timeout") ||
    message.includes("Request context disposed")
  );
}

function isTransientNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("ECONNABORTED") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("EPIPE") ||
    message.includes("socket hang up")
  );
}

async function isCsrfMismatchResponse(response: APIResponse): Promise<boolean> {
  if (response.status() !== 403) {
    return false;
  }
  try {
    const body = (await response.json()) as {
      error?: { code?: string };
    };
    return body?.error?.code === "CSRF_MISMATCH";
  } catch {
    return false;
  }
}

async function executeWithToken(
  request: APIRequestContext,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  options: RequestOptions,
  token: string,
): Promise<APIResponse> {
  const startTime = Date.now();
  const csrfToken = MUTATING_METHODS.has(method) ? await TokenManager.getCsrf() : undefined;
  const requestOptions = {
    ...normalizeOptions(options),
    headers: buildHeaders(token, options.headers, csrfToken, method),
  };

  const response = await (() => {
    switch (method) {
      case "GET":
        return request.get(url, requestOptions);
      case "POST":
        return request.post(url, requestOptions);
      case "PUT":
        return request.put(url, requestOptions);
      case "PATCH":
        return request.patch(url, requestOptions);
      case "DELETE":
        return request.delete(url, requestOptions);
    }
  })();

  LoggerEngine.api({
    method,
    url,
    status: response.status(),
    responseTimeMs: Date.now() - startTime,
  });

  return response;
}

async function requestWithAutoRefresh(
  request: APIRequestContext,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  const resolvedUrl = resolveApiPath(url);
  const normalizedOptions = normalizeOptions(options);

  const runRequest = async (token: string): Promise<APIResponse> => {
    if (method === "GET") {
      return executeWithToken(request, method, resolvedUrl, normalizedOptions, token);
    }

    return RetryEngine.execute(
      async () => executeWithToken(request, method, resolvedUrl, normalizedOptions, token),
      (response, error) => {
        if (error != null) {
          if (isNonRetryableError(error)) {
            return false;
          }
          return isTransientNetworkError(error);
        }
        return (
          Boolean(response) && WRITE_RETRYABLE_STATUSES.has((response as APIResponse).status())
        );
      },
      {
        retries: WRITE_RETRIES,
        delayMs: WRITE_RETRY_DELAY_MS,
        label: `${method} ${resolvedUrl}`,
        onRetry: ({ failedAttempt, result }) => {
          LoggerEngine.warn(
            `[retry] ${method} ${resolvedUrl} status=${result?.status() ?? "error"} attempt=${failedAttempt}`,
          );
        },
      },
    );
  };

  let token = await TokenManager.getToken();
  let response = await runRequest(token);

  if (response.status() === 401) {
    LoggerEngine.info(`${method} ${resolvedUrl} received 401; recovering session (refresh first)`);
    try {
      token = await TokenManager.handleUnauthorized(token);
      response = await executeWithToken(request, method, resolvedUrl, normalizedOptions, token);
    } catch (error) {
      LoggerEngine.warn(
        `${method} ${resolvedUrl} 401 recovery failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Return the original 401 so the test asserts auth failure instead of starting
      // another captcha login storm.
      return response;
    }
    if (response.status() === 401) {
      LoggerEngine.warn(
        `${method} ${resolvedUrl} still 401 after recovery; keeping session for cooldown (no discard storm)`,
      );
    }
  }

  if (await isCsrfMismatchResponse(response)) {
    LoggerEngine.info(`${method} ${resolvedUrl} received CSRF_MISMATCH; refreshing session`);
    await TokenManager.forceSessionRefresh();
    token = await TokenManager.getToken();
    response = await executeWithToken(request, method, resolvedUrl, normalizedOptions, token);
  }

  return response;
}

export function getWithAutoRefresh(
  request: APIRequestContext,
  url: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  return requestWithAutoRefresh(request, "GET", url, options);
}

export function postWithAutoRefresh(
  request: APIRequestContext,
  url: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  return requestWithAutoRefresh(request, "POST", url, options);
}

export function putWithAutoRefresh(
  request: APIRequestContext,
  url: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  return requestWithAutoRefresh(request, "PUT", url, options);
}

export function patchWithAutoRefresh(
  request: APIRequestContext,
  url: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  return requestWithAutoRefresh(request, "PATCH", url, options);
}

export function deleteWithAutoRefresh(
  request: APIRequestContext,
  url: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  return requestWithAutoRefresh(request, "DELETE", url, options);
}
