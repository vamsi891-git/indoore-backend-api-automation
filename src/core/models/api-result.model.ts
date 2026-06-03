import { APIResponse } from "@playwright/test";

export interface ApiCallResult<T = any> {
  rawResponse: APIResponse;
  responseBody: T;
  responseTime: number;
}

export interface ApiCallResultWithTimeout<T = any> extends Partial<ApiCallResult<T>> {
  responseTime: number;
  timeout: boolean;
}
