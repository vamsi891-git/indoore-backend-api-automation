import { APIRequestContext, APIResponse } from "@playwright/test";
import { getRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import type { AtrReportQuery, AtrReportResponse } from "../Mapper/atr-report.types";

export const REVENUE_PROTECTION_ATR_REPORT_PATH = "/indore/revenue-protection/atr-report";

export const REVENUE_PROTECTION_ATR_REPORT_EXPORT_PATH = `${REVENUE_PROTECTION_ATR_REPORT_PATH}/export`;

export interface AtrReportApiResult {
  rawResponse: APIResponse;
  responseBody: AtrReportResponse;
  responseTime: number;
}

export interface AtrReportExportApiResult {
  rawResponse: APIResponse;
  body: Buffer;
  contentType: string;
  contentDisposition: string;
  responseTime: number;
}

export function buildAtrReportQueryString(query: AtrReportQuery): string {
  const params = new URLSearchParams();
  params.set("reportType", query.reportType);
  if (query.year !== undefined && query.year !== "") {
    params.set("year", String(query.year));
  }
  if (query.month !== undefined && query.month !== "") {
    params.set("month", String(query.month));
  }
  if (query.organisationLookupId !== undefined) {
    params.set("organisationLookupId", String(query.organisationLookupId));
  }
  if (query.networkLookupId !== undefined) {
    params.set("networkLookupId", String(query.networkLookupId));
  }
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 10));
  return params.toString();
}

/** Export query — page/limit are not used by the export endpoint. */
export function buildAtrReportExportQueryString(query: AtrReportQuery): string {
  const params = new URLSearchParams();
  params.set("reportType", query.reportType);
  if (query.year !== undefined && query.year !== "") {
    params.set("year", String(query.year));
  }
  if (query.month !== undefined && query.month !== "") {
    params.set("month", String(query.month));
  }
  if (query.organisationLookupId !== undefined) {
    params.set("organisationLookupId", String(query.organisationLookupId));
  }
  if (query.networkLookupId !== undefined) {
    params.set("networkLookupId", String(query.networkLookupId));
  }
  return params.toString();
}

export class AtrReportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getAtrReport(query: AtrReportQuery): Promise<AtrReportApiResult> {
    const url = `${REVENUE_PROTECTION_ATR_REPORT_PATH}?${buildAtrReportQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: AtrReportResponse;
    try {
      responseBody = (await response.json()) as AtrReportResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }

  async exportAtrReport(query: AtrReportQuery): Promise<AtrReportExportApiResult> {
    const url = `${REVENUE_PROTECTION_ATR_REPORT_EXPORT_PATH}?${buildAtrReportExportQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    const body = Buffer.from(await response.body());
    return {
      rawResponse: response,
      body,
      contentType: response.headers()["content-type"] ?? "",
      contentDisposition: response.headers()["content-disposition"] ?? "",
      responseTime,
    };
  }
}
