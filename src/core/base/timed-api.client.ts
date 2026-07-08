import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  deleteWithAutoRefresh,
  getWithAutoRefresh,
  patchWithAutoRefresh,
  postWithAutoRefresh,
  putWithAutoRefresh
} from "../utils/authenticated.request";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../constants/api-timeouts";
import { ApiCallResult } from "../models/api-result.model";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RequestOptions = Parameters<typeof getWithAutoRefresh>[2];

const TRANSIENT_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_REQUEST_ATTEMPTS = 4;
const REQUEST_RETRY_DELAY_MS = 4_000;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientResponseBody(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<html") || trimmed.includes("too many request");
}

function shouldRetryRequest(
  status: number,
  bodyText: string,
  attempt: number,
): boolean {
  if (attempt >= MAX_REQUEST_ATTEMPTS) {
    return false;
  }
  if (TRANSIENT_HTTP_STATUSES.has(status)) {
    return true;
  }
  return isTransientResponseBody(bodyText);
}

export class TimedApiClient {
  constructor(protected readonly authenticatedApi: APIRequestContext) {}

  protected getJson<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("GET", path, options);
  }

  protected postJson<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("POST", path, options);
  }

  protected putJson<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("PUT", path, options);
  }

  protected patchJson<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("PATCH", path, options);
  }

  protected deleteJson<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiCallResult<T>> {
    return this.requestJson<T>("DELETE", path, options);
  }

  protected async requestJson<T = any>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiCallResult<T>> {
    const requestOptions = { timeout: DEFAULT_REQUEST_TIMEOUT_MS, ...options };
    const start = Date.now();
    let rawResponse!: APIResponse;
    let text = "";

    for (let attempt = 1; attempt <= MAX_REQUEST_ATTEMPTS; attempt++) {
      rawResponse = await this.dispatch(method, path, requestOptions);
      text = await rawResponse.text();

      if (shouldRetryRequest(rawResponse.status(), text, attempt)) {
        await sleep(REQUEST_RETRY_DELAY_MS * attempt);
        continue;
      }

      break;
    }

    let responseBody: T;
    if (!text) {
      responseBody = null as T;
    } else {
      try {
        responseBody = JSON.parse(text) as T;
      } catch {
        throw new Error(
          `${method} ${path} returned non-JSON (${rawResponse.status()}): ${text.slice(0, 200)}`
        );
      }
    }
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start
    };
  }

  private dispatch(
    method: HttpMethod,
    path: string,
    options: RequestOptions
  ): Promise<APIResponse> {
    switch (method) {
      case "GET":
        return getWithAutoRefresh(this.authenticatedApi, path, options);
      case "POST":
        return postWithAutoRefresh(this.authenticatedApi, path, options);
      case "PUT":
        return putWithAutoRefresh(this.authenticatedApi, path, options);
      case "PATCH":
        return patchWithAutoRefresh(this.authenticatedApi, path, options);
      case "DELETE":
        return deleteWithAutoRefresh(this.authenticatedApi, path, options);
    }
  }
}
