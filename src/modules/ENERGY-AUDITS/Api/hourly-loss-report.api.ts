import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  HourlyLossReportQuery,
  HourlyLossReportResponse,
} from "../Mapper/hourly-loss-report.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { printApiResponse } from "../../../core/utils/response-console.util";

export interface HourlyLossReportApiResult {
  rawResponse: APIResponse;
  responseBody: HourlyLossReportResponse;
  responseTime: number;
}

export class HourlyLossReportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getHourlyLossReport(
    query: HourlyLossReportQuery,
  ): Promise<HourlyLossReportApiResult> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/energy-audit/hourly-loss-report",
      { params: query as unknown as Record<string, string | number> },
    );
    const responseTime = Date.now() - start;
    const bodyText = await rawResponse.text();
    const responseBody = (
      bodyText ? JSON.parse(bodyText) : { success: false }
    ) as HourlyLossReportResponse;

    if (!rawResponse.ok()) {
      printApiResponse({
        apiName: "Energy Audit Hourly Loss Report",
        status: rawResponse.status(),
        body: bodyText,
        requestParams: query,
      });
    }

    return { rawResponse, responseBody, responseTime };
  }
}
