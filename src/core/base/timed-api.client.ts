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
    const rawResponse = await this.dispatch(method, path, requestOptions);
    const text = await rawResponse.text();
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
