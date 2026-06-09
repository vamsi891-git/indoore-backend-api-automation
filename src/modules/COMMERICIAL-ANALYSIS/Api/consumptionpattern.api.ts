// Api/consumption-pattern.api.ts

import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumptionPatternResponse } from "../Mapper/consumptionpattern.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface ConsumptionPatternApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumptionPatternResponse;
  responseTime: number;
}

export class ConsumptionPatternApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}
  async getConsumptionPattern(
    params: Record<string, string | number | boolean>,
  ): Promise<ConsumptionPatternApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(this.authenticatedApi,
      "/indore/analysis/commercial/consumption-pattern",
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
