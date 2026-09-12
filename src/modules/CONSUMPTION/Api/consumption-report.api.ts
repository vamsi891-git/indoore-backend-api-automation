import { APIRequestContext, APIResponse } from "@playwright/test";
import { getConsumptionWithRetry } from "../utils/consumption-request.helper";

export type ConsumptionReportType =
  | "daily"
  | "hourly"
  | "monthly"
  | "nightZero";

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
    filters: { msn?: string; ivrsNumber?: string } = {},
    extras: Record<string, string | number | boolean> = {},
  ): Promise<ConsumptionReportApiResult<T>> {
    const params: Record<string, string | number | boolean> = {
      reportType,
      page,
      limit,
      fromDate,
      toDate,
      month,
      year,
      ...extras,
    };
    if (filters.msn?.trim()) params.msn = filters.msn.trim();
    if (filters.ivrsNumber?.trim()) params.ivrsNumber = filters.ivrsNumber.trim();

    const { response, responseTime } = await getConsumptionWithRetry(
      this.authenticatedApi,
      "/indore/consumption/report",
      { params },
    );
    return {
      rawResponse: response,
      responseBody: await response.json(),
      responseTime,
    };
  }
}
