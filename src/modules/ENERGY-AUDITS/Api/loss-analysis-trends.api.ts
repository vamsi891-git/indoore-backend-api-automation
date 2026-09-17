import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  LossAnalysisTrendsQuery,
  LossAnalysisTrendsResponse,
} from "../Mapper/loss-analysis-trends.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { printApiResponse } from "../../../core/utils/response-console.util";

export interface LossAnalysisTrendsApiResult {
  rawResponse: APIResponse;
  responseBody: LossAnalysisTrendsResponse;
  responseTime: number;
}

export class LossAnalysisTrendsApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getLossAnalysisTrends(
    query: LossAnalysisTrendsQuery,
  ): Promise<LossAnalysisTrendsApiResult> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/energy-audit/loss-analysis-trends",
      { params: query as unknown as Record<string, string | number> },
    );
    const responseTime = Date.now() - start;
    const bodyText = await rawResponse.text();
    const responseBody = (
      bodyText ? JSON.parse(bodyText) : { success: false }
    ) as LossAnalysisTrendsResponse;

    if (!rawResponse.ok()) {
      printApiResponse({
        apiName: "Energy Audit Loss Analysis Trends",
        status: rawResponse.status(),
        body: bodyText,
        requestParams: query,
      });
    }

    return { rawResponse, responseBody, responseTime };
  }
}
