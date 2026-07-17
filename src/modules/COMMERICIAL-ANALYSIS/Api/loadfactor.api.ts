import { APIRequestContext, APIResponse } from "@playwright/test";
import { LFAnalysisResponse } from "../Mapper/loadfactor.mapper";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";

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
    const { response, responseTime } = await getCommercialWithRetry(
      this.authenticatedApi,
      "/indore/analysis/commercial/lf",
      { params },
    );

    const responseBody = (await response
      .json()
      .catch(() => ({}))) as LFAnalysisResponse;

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
