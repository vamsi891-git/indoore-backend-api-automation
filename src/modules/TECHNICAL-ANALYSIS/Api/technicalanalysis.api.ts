import { APIRequestContext, APIResponse } from "@playwright/test";
import { TechnicalReportResponse } from "../Mapper/technicalanalysis.mapper";
import { getTechnicalReportWithRetry } from "../utils/technical-request.helper";

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
    const { response, responseTime } = await getTechnicalReportWithRetry(
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

    let responseBody: TechnicalReportResponse;
    try {
      responseBody = (await response.json()) as TechnicalReportResponse;
    } catch {
      responseBody = {
        success: false,
        data: { rows: [], pagination: { page: 1, limit: pageSize, total: 0, totalPages: 0 } },
      };
    }

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
