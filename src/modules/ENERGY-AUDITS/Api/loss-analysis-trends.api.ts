import { APIRequestContext, APIResponse } from "@playwright/test";
import { LossAnalysisTrendsQuery, LossAnalysisTrendsResponse,} from "../Mapper/loss-analysis-trends.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
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
    if (!rawResponse.ok()) {
      throw new Error(
        `Loss Analysis Trends API failed — status ${rawResponse.status()}: ${await rawResponse.text()}`,
      );
    }
    return {
      rawResponse,
      responseBody: (await rawResponse.json()) as LossAnalysisTrendsResponse,
      responseTime,
    };
  }
}
