import { APIRequestContext, APIResponse } from "@playwright/test";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";

export interface PowerFactorApiResult {
  rawResponse: APIResponse;
  responseBody: any;
  responseTime: number;
}

export class PowerFactorApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getPfAnalysis(params: any): Promise<PowerFactorApiResult> {
    const { response, responseTime } = await getCommercialWithRetry(
      this.authenticatedApi,
      "/indore/analysis/commercial/pf",
      { params },
    );

    const responseBody = await response.json().catch(() => ({}));

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
