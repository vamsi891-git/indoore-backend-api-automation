import { APIRequestContext, APIResponse } from "@playwright/test";
import { HourlyLossReportQuery, HourlyLossReportResponse, } from "../Mapper/hourly-loss-report.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface HourlyLossReportApiResult {
  rawResponse: APIResponse;
  responseBody: HourlyLossReportResponse;
  responseTime: number;
}
export class HourlyLossReportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}
  async getHourlyLossReport(query: HourlyLossReportQuery,): Promise<HourlyLossReportApiResult> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/energy-audit/hourly-loss-report",
      { params: query as unknown as Record<string, string | number> },
    );
    const responseTime = Date.now() - start;
    if (!rawResponse.ok()) {
      throw new Error(
        `Hourly Loss Report API failed — status ${rawResponse.status()}: ${await rawResponse.text()}`,
      );
    }
    return {
      rawResponse,
      responseBody: (await rawResponse.json()) as HourlyLossReportResponse,
      responseTime,
    };
  }
}
