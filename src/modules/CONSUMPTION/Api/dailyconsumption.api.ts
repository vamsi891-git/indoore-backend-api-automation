import { APIRequestContext } from "@playwright/test";
import { ConsumptionReportApi } from "./consumption-report.api";
import { DailyConsumptionResponse } from "../Mapper/dailyconsumption.mapper";

export interface DailyConsumptionApiResult {
  rawResponse: import("@playwright/test").APIResponse;
  responseBody: DailyConsumptionResponse;
  responseTime: number;
}

export class DailyConsumptionApi {
  private readonly reportApi: ConsumptionReportApi;

  constructor(authenticatedApi: APIRequestContext) {
    this.reportApi = new ConsumptionReportApi(authenticatedApi);
  }

  async getDailyReport(
    page: number,
    limit: number,
    fromDate: string,
    toDate: string,
    month: number,
    year: number,
  ): Promise<DailyConsumptionApiResult> {
    return this.reportApi.getReport<DailyConsumptionResponse>(
      "daily",
      page,
      limit,
      fromDate,
      toDate,
      month,
      year,
    );
  }
}
