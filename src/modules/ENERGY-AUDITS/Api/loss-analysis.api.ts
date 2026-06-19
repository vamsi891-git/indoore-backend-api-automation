import { APIRequestContext, APIResponse } from "@playwright/test";
import { LossAnalysisQuery, LossAnalysisResponse,} from "../Mapper/loss-analysis.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { printApiResponse } from "../../../core/utils/response-console.util";
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
      const errorBody = await rawResponse.text();
      printApiResponse({
        apiName: "Energy Audit Loss Analysis",
        status: rawResponse.status(),
        body: errorBody,
        requestParams: query,
      });
      throw new Error(
        `Loss Analysis API failed — status ${rawResponse.status()}: ${errorBody}`,
      );
    }
    return {
      rawResponse,
      responseBody: (await rawResponse.json()) as LossAnalysisResponse,
      responseTime,
    };
  }
}
