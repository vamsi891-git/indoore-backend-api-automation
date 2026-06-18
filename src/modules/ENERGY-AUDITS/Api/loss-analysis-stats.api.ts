import { APIRequestContext, APIResponse } from "@playwright/test";
import { LossAnalysisStatsQuery, LossAnalysisStatsResponse,} from "../Mapper/loss-analysis-stats.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
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
    if (!rawResponse.ok()) {
      throw new Error(
        `Loss Analysis Stats API failed — status ${rawResponse.status()}: ${await rawResponse.text()}`,
      );
    }
    return {
      rawResponse,
      responseBody: (await rawResponse.json()) as LossAnalysisStatsResponse,
      responseTime,
    };
  }
}
