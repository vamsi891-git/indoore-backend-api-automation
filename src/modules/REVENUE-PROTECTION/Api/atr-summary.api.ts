import { APIRequestContext, APIResponse } from "@playwright/test";
import { getRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import type {
  AtrSummaryDetailsQuery,
  AtrSummaryQuery,
  AtrSummaryResponse,
} from "../Mapper/atr-summary.types";

export const REVENUE_PROTECTION_ATR_SUMMARY_PATH = "/indore/revenue-protection/atr-summary";

export const REVENUE_PROTECTION_ATR_SUMMARY_EXPORT_PATH = `${REVENUE_PROTECTION_ATR_SUMMARY_PATH}/export`;

export const REVENUE_PROTECTION_ATR_SUMMARY_DETAILS_PATH = `${REVENUE_PROTECTION_ATR_SUMMARY_PATH}/details`;

export const REVENUE_PROTECTION_ATR_SUMMARY_DETAILS_EXPORT_PATH = `${REVENUE_PROTECTION_ATR_SUMMARY_DETAILS_PATH}/export`;

export interface AtrSummaryApiResult {
  rawResponse: APIResponse;
  responseBody: AtrSummaryResponse;
  responseTime: number;
}

export interface AtrSummaryExportApiResult {
  rawResponse: APIResponse;
  body: Buffer;
  contentType: string;
  contentDisposition: string;
  responseTime: number;
}

function appendHierarchyParams(
  params: URLSearchParams,
  query: {
    month?: number | string;
    parentId?: number | string;
    circleId?: number | string;
    divisionId?: number | string;
    zoneId?: number | string;
    feederId?: number | string;
  },
): void {
  if (query.month !== undefined && query.month !== "") {
    params.set("month", String(query.month));
  }
  if (query.parentId !== undefined && query.parentId !== "") {
    params.set("parentId", String(query.parentId));
  }
  if (query.circleId !== undefined && query.circleId !== "") {
    params.set("circleId", String(query.circleId));
  }
  if (query.divisionId !== undefined && query.divisionId !== "") {
    params.set("divisionId", String(query.divisionId));
  }
  if (query.zoneId !== undefined && query.zoneId !== "") {
    params.set("zoneId", String(query.zoneId));
  }
  if (query.feederId !== undefined && query.feederId !== "") {
    params.set("feederId", String(query.feederId));
  }
}

export function buildAtrSummaryQueryString(query: AtrSummaryQuery): string {
  const params = new URLSearchParams();
  params.set("year", String(query.year));
  params.set("reportType", String(query.reportType));
  params.set("hierarchyLevel", String(query.hierarchyLevel));
  appendHierarchyParams(params, query);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  return params.toString();
}

/** Summary export — same filters as list, without page/limit. */
export function buildAtrSummaryExportQueryString(query: AtrSummaryQuery): string {
  const params = new URLSearchParams();
  params.set("year", String(query.year));
  params.set("reportType", String(query.reportType));
  params.set("hierarchyLevel", String(query.hierarchyLevel));
  appendHierarchyParams(params, query);
  return params.toString();
}

export function buildAtrSummaryDetailsQueryString(query: AtrSummaryDetailsQuery): string {
  const params = new URLSearchParams();
  params.set("year", String(query.year));
  params.set("reportType", String(query.reportType));
  appendHierarchyParams(params, query);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  return params.toString();
}

/** Details export — same filters as details list, without page/limit. */
export function buildAtrSummaryDetailsExportQueryString(query: AtrSummaryDetailsQuery): string {
  const params = new URLSearchParams();
  params.set("year", String(query.year));
  params.set("reportType", String(query.reportType));
  appendHierarchyParams(params, query);
  return params.toString();
}

export class AtrSummaryApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getAtrSummary(query: AtrSummaryQuery): Promise<AtrSummaryApiResult> {
    const url = `${REVENUE_PROTECTION_ATR_SUMMARY_PATH}?${buildAtrSummaryQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: AtrSummaryResponse;
    try {
      responseBody = (await response.json()) as AtrSummaryResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }

  async exportAtrSummary(query: AtrSummaryQuery): Promise<AtrSummaryExportApiResult> {
    const url = `${REVENUE_PROTECTION_ATR_SUMMARY_EXPORT_PATH}?${buildAtrSummaryExportQueryString(query)}`;
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

  async getAtrSummaryDetails(query: AtrSummaryDetailsQuery): Promise<AtrSummaryApiResult> {
    const url = `${REVENUE_PROTECTION_ATR_SUMMARY_DETAILS_PATH}?${buildAtrSummaryDetailsQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: AtrSummaryResponse;
    try {
      responseBody = (await response.json()) as AtrSummaryResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }

  async exportAtrSummaryDetails(query: AtrSummaryDetailsQuery): Promise<AtrSummaryExportApiResult> {
    const url = `${REVENUE_PROTECTION_ATR_SUMMARY_DETAILS_EXPORT_PATH}?${buildAtrSummaryDetailsExportQueryString(query)}`;
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
