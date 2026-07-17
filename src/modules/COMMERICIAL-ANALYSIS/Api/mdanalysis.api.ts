import { APIRequestContext, APIResponse } from "@playwright/test";
import { MdAnalysisResponse } from "../Mapper/mdanalysis.mapper";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";

export interface MdAnalysisApiResult {
  rawResponse: APIResponse;
  responseBody: MdAnalysisResponse;
  responseTime: number;
}

export class MdAnalysisApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getMdAnalysis(
    params: Record<string, string | number | boolean>,
  ): Promise<MdAnalysisApiResult> {
    const { response, responseTime } = await getCommercialWithRetry(
      this.authenticatedApi,
      "/indore/analysis/commercial/md",
      { params },
    );

    const responseBody = (await response
      .json()
      .catch(() => ({}))) as MdAnalysisResponse;

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
