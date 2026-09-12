import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  TECHNICAL_ANALYSIS_PHASE_REQUEST_TIMEOUT_MS,
  TECHNICAL_ANALYSIS_REQUEST_TIMEOUT_MS,
} from "../../../core/constants/api-timeouts";
import { TechnicalReportResponse } from "../Mapper/technicalanalysis.mapper";
import { getTechnicalReportWithRetry } from "../utils/technical-request.helper";
export interface TechnicalReportApiResult {
  rawResponse: APIResponse;
  responseBody: TechnicalReportResponse;
  responseTime: number;
}
export interface TechnicalReportQuery {
  analysisType?: string;
  month?: number;
  year?: number;
  category?: string;
  pageSize?: number;
  page?: number;
  [key: string]: string | number | boolean | undefined;
}
export class TechnicalReportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}
  async getTechnicalReport(
    query: TechnicalReportQuery,
  ): Promise<TechnicalReportApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }
    const isPhaseReport = String(query.analysisType ?? "").startsWith("phase_");
    const { response, responseTime } = await getTechnicalReportWithRetry(
      this.authenticatedApi,
      "/indore/analysis/technical/report",
      {
        params,
        requestTimeoutMs: isPhaseReport
          ? TECHNICAL_ANALYSIS_PHASE_REQUEST_TIMEOUT_MS
          : TECHNICAL_ANALYSIS_REQUEST_TIMEOUT_MS,
      },
    );
    let responseBody: TechnicalReportResponse;
    try {
      responseBody = (await response.json()) as TechnicalReportResponse;
    } catch {
      responseBody = { success: false };
    }
    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
  /** @deprecated Use getTechnicalReport({ analysisType, month, year, pageSize }) */
  async getTechnicalReportLegacy(
    analysisType: string,
    month: number,
    year: number,
    pageSize: number = 100,
  ): Promise<TechnicalReportApiResult> {
    return this.getTechnicalReport({
      analysisType,
      month,
      year,
      category: "total",
      pageSize,
    });
  }
}
