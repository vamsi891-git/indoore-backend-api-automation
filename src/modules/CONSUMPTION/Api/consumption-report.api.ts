import { APIRequestContext, APIResponse } from "@playwright/test";
import { getConsumptionWithRetry } from "../utils/consumption-request.helper";

export type ConsumptionReportType = "daily" | "hourly" | "monthly";

export interface ConsumptionReportApiResult<T = unknown> {
  rawResponse: APIResponse;
  responseBody: T;
  responseTime: number;
}

export class ConsumptionReportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getReport<T = unknown>(
    reportType: ConsumptionReportType,
    page: number,
    limit: number,
    fromDate: string,
    toDate: string,
    month: number,
    year: number,
  ): Promise<ConsumptionReportApiResult<T>> {
    const { response, responseTime } = await getConsumptionWithRetry(
      this.authenticatedApi,
      "/indore/consumption/report",
      {
        params: {
          reportType,
          page,
          limit,
          fromDate,
          toDate,
          month,
          year,
        },
      },
    );
    return {
      rawResponse: response,
      responseBody: await response.json(),
      responseTime,
    };
  }
}
