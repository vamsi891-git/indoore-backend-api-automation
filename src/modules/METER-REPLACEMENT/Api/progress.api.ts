import { APIRequestContext, APIResponse } from "@playwright/test";
import { ProgressResponse } from "../Mapper/progress.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {
  safeResponseJson,
  withRateLimitRetry,
} from "../utils/response.helper";

export interface ProgressApiResult {
  rawResponse: APIResponse;
  responseBody: ProgressResponse;
  responseTime: number;
}

export class ProgressApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getProgress(
    params?: Record<string, string | number | boolean>,
  ): Promise<ProgressApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/progress",
        params ? { params } : undefined,
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<ProgressResponse>(response),
      responseTime: Date.now() - start,
    };
  }

  async getProgressWithTrailingSlash(): Promise<ProgressApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/progress/",
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<ProgressResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
