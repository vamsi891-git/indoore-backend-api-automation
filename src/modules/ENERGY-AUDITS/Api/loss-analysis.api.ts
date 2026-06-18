import { APIRequestContext, APIResponse } from "@playwright/test";
import { LossAnalysisQuery, LossAnalysisResponse,} from "../Mapper/loss-analysis.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface LossAnalysisApiResult {
  rawResponse: APIResponse;
  responseBody: LossAnalysisResponse;
  responseTime: number;
}
export class LossAnalysisApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}
  async getLossAnalysis(query: LossAnalysisQuery): Promise<LossAnalysisApiResult> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/energy-audit/loss-analysis",
      { params: query as unknown as Record<string, string | number> },
    );
    const responseTime = Date.now() - start;
    if (!rawResponse.ok()) {
      throw new Error(
        `Loss Analysis API failed — status ${rawResponse.status()}: ${await rawResponse.text()}`,
      );
    }
    return {
      rawResponse,
      responseBody: (await rawResponse.json()) as LossAnalysisResponse,
      responseTime,
    };
  }
}
