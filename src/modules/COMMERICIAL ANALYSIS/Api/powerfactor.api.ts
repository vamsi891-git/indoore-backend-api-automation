import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface PowerFactorApiResult {
  rawResponse: APIResponse;
  responseBody: any;
  responseTime: number;
}

export class PowerFactorApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getPfAnalysis(params: any): Promise<PowerFactorApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/analysis/commercial/pf",
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
