import { APIRequestContext, APIResponse } from "@playwright/test";
import { MdAnalysisResponse } from "../Mapper/mdanalysis.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

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
    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/analysis/commercial/md",
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
