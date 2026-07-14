import { APIRequestContext, APIResponse } from "@playwright/test";
import { DashboardSummaryResponse } from "../Mapper/dashboard-summary.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {
  safeResponseJson,
  withRateLimitRetry,
} from "../utils/response.helper";

export interface DashboardSummaryApiResult {
  rawResponse: APIResponse;
  responseBody: DashboardSummaryResponse;
  responseTime: number;
}

export class DashboardSummaryApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getDashboardSummary(
    params?: Record<string, string | number | boolean>,
  ): Promise<DashboardSummaryApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/dashboard-summary",
        params ? { params } : undefined,
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<DashboardSummaryResponse>(response),
      responseTime: Date.now() - start,
    };
  }

  async getDashboardSummaryWithTrailingSlash(): Promise<DashboardSummaryApiResult> {
    const start = Date.now();

    const response = await withRateLimitRetry(() =>
      getWithAutoRefresh(
        this.authenticatedApi,
        "/indore/meter-replacement/dashboard-summary/",
      ),
    );

    return {
      rawResponse: response,
      responseBody: await safeResponseJson<DashboardSummaryResponse>(response),
      responseTime: Date.now() - start,
    };
  }
}
