import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  LossAnalysisStatsQuery,
  LossAnalysisStatsResponse,
} from "../Mapper/loss-analysis-stats.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { printApiResponse } from "../../../core/utils/response-console.util";

export interface LossAnalysisStatsApiResult {
  rawResponse: APIResponse;
  responseBody: LossAnalysisStatsResponse;
  responseTime: number;
}

export class LossAnalysisStatsApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getLossAnalysisStats(
    query: LossAnalysisStatsQuery,
  ): Promise<LossAnalysisStatsApiResult> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/energy-audit/loss-analysis-stats",
      { params: query as unknown as Record<string, string | number> },
    );
    const responseTime = Date.now() - start;
    const bodyText = await rawResponse.text();
    const responseBody = (
      bodyText ? JSON.parse(bodyText) : { success: false }
    ) as LossAnalysisStatsResponse;

    if (!rawResponse.ok()) {
      printApiResponse({
        apiName: "Energy Audit Loss Analysis Stats",
        status: rawResponse.status(),
        body: bodyText,
        requestParams: query,
      });
    }

    return { rawResponse, responseBody, responseTime };
  }
}
