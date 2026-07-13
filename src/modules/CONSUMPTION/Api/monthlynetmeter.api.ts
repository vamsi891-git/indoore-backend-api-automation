import { APIRequestContext, APIResponse } from "@playwright/test";
import { MonthlyNetMeterResponse } from "../Mapper/monthlynetmeter.mapper";
import { getConsumptionWithRetry } from "../utils/consumption-request.helper";

export interface MonthlyNetMeterApiResult {
  rawResponse: APIResponse;
  responseBody: MonthlyNetMeterResponse;
  responseTime: number;
}

export class MonthlyNetMeterApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getMonthlyNetMeter(
    page: number,
    limit: number,
    month: number,
    year: number,
  ): Promise<MonthlyNetMeterApiResult> {
    const { response, responseTime } = await getConsumptionWithRetry(
      this.authenticatedApi,
      "/indore/consumption/monthly-net-meter",
      {
        params: { page, limit, month, year },
      },
    );

    const text = await response.text();
    let responseBody: MonthlyNetMeterResponse;
    if (!text) {
      responseBody = { success: false };
    } else {
      responseBody = JSON.parse(text) as MonthlyNetMeterResponse;
    }

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
