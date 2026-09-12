import { APIRequestContext, APIResponse } from "@playwright/test";
import { FeederDailyConsumptionResponse } from "../Mapper/feeder-daily-consumption.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface FeederDailyConsumptionApiResult {
  rawResponse: APIResponse;
  responseBody: FeederDailyConsumptionResponse;
  responseTime: number;
}

export class FeederDailyConsumptionApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getDailyConsumption(
    feederCode: string,
    granularity: string,
    extras: Record<string, string | number | boolean> = {},
  ): Promise<FeederDailyConsumptionApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      `/indore/feeder/${encodeURIComponent(feederCode)}/daily-consumption`,
      {
        params: { granularity, ...extras },
      },
    );
    return {
      rawResponse: response,
      responseBody: await response.json(),
      responseTime: Date.now() - start,
    };
  }
}
