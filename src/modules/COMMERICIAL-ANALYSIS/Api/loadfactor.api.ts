import { APIRequestContext, APIResponse } from "@playwright/test";

import { LFAnalysisResponse } from "../Mapper/loadfactor.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface LFAnalysisApiResult {
  rawResponse: APIResponse;
  responseBody: LFAnalysisResponse;
  responseTime: number;
}
export class LFAnalysisApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}
  async getLFAnalysis(
    params: Record<string, string | number | boolean>,
  ): Promise<LFAnalysisApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(this.authenticatedApi,
      "/indore/analysis/commercial/lf",
      { params },
    );
    const responseTime = Date.now() - start;
    if (!response.ok()) {
      throw new Error(`
        Status: ${response.status()}
        Body: ${await response.text()}
      `);
    }
    return {
      rawResponse: response,
      responseBody: await response.json(), 
      responseTime,
    };
  }
}
