import { APIRequestContext, APIResponse } from "@playwright/test";
import { TECHNICAL_ANALYSIS_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { TechnicalSummaryResponse } from "../Mapper/technical-summary.mapper";

export interface TechnicalSummaryApiResult {
  rawResponse: APIResponse;
  responseBody: TechnicalSummaryResponse;
  responseTime: number;
}

export interface TechnicalSummaryQuery {
  month?: number;
  year?: number;
  [key: string]: string | number | boolean | undefined;
}

export class TechnicalSummaryApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getTechnicalSummary(
    query: TechnicalSummaryQuery = {},
  ): Promise<TechnicalSummaryApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/analysis/technical/summary",
      {
        timeout: TECHNICAL_ANALYSIS_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );

    let responseBody: TechnicalSummaryResponse;
    try {
      responseBody = (await response.json()) as TechnicalSummaryResponse;
    } catch {
      responseBody = { success: false };
    }

    return {
      rawResponse: response,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
