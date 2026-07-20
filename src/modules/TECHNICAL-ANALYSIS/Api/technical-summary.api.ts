import { APIRequestContext, APIResponse } from "@playwright/test";
import { TechnicalSummaryResponse } from "../Mapper/technical-summary.mapper";
import { getTechnicalReportWithRetry } from "../utils/technical-request.helper";
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
    const { response, responseTime } = await getTechnicalReportWithRetry(
      this.authenticatedApi,
      "/indore/analysis/technical/summary",
      Object.keys(params).length > 0 ? { params } : undefined,
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
      responseTime,
    };
  }
}
