import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumptionCompareResponse } from "../Mapper/consumptioncompare.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface ConsumptionCompareApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumptionCompareResponse;
  responseTime: number;
}

export class ConsumptionCompareApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getConsumptionCompare(
    params: Record<string, string | number | boolean>,
  ): Promise<ConsumptionCompareApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/analysis/commercial/consumption-compare",
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
