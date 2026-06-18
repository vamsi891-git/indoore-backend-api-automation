import { APIRequestContext, APIResponse } from "@playwright/test";
import { TechnicalReportResponse } from "../Mapper/technicalanalysis.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface TechnicalReportApiResult {
  rawResponse: APIResponse;
  responseBody: TechnicalReportResponse;
  responseTime: number;
}

export class TechnicalReportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getTechnicalReport(
    analysisType: string,
    month: number,
    year: number,
    pageSize: number = 100,
  ): Promise<TechnicalReportApiResult> {
    const startTime = Date.now();

    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/analysis/technical/report",
      {
        params: {
          analysisType,
          month,
          year,
          category: "total",
          pageSize,
        },
      },
    );

    const responseTime = Date.now() - startTime;

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
