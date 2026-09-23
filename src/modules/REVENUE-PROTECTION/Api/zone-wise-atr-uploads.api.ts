import { APIRequestContext, APIResponse } from "@playwright/test";
import { getRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import type {
  ZoneWiseAtrUploadsQuery,
  ZoneWiseAtrUploadsResponse,
  ZoneWiseAtrUploadsSummaryQuery,
  ZoneWiseAtrUploadsSummaryResponse,
} from "../Mapper/zone-wise-atr-uploads.types";

export const REVENUE_PROTECTION_ZONE_WISE_ATR_UPLOADS_PATH =
  "/indore/revenue-protection/zone-wise-atr-uploads";

export const REVENUE_PROTECTION_ZONE_WISE_ATR_UPLOADS_SUMMARY_PATH = `${REVENUE_PROTECTION_ZONE_WISE_ATR_UPLOADS_PATH}/summary`;

export interface ZoneWiseAtrUploadsApiResult {
  rawResponse: APIResponse;
  responseBody: ZoneWiseAtrUploadsResponse;
  responseTime: number;
}

export interface ZoneWiseAtrUploadsSummaryApiResult {
  rawResponse: APIResponse;
  responseBody: ZoneWiseAtrUploadsSummaryResponse;
  responseTime: number;
}

export function buildZoneWiseAtrUploadsQueryString(query: ZoneWiseAtrUploadsQuery): string {
  const params = new URLSearchParams();
  params.set("month", String(query.month));
  params.set("year", String(query.year));
  if (query.status !== undefined && query.status !== "" && query.status !== "--") {
    params.set("status", String(query.status));
  }
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 10));
  return params.toString();
}

export function buildZoneWiseAtrUploadsSummaryQueryString(
  query: ZoneWiseAtrUploadsSummaryQuery,
): string {
  const params = new URLSearchParams();
  params.set("month", String(query.month));
  params.set("year", String(query.year));
  return params.toString();
}

export class ZoneWiseAtrUploadsApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getZoneWiseAtrUploads(
    query: ZoneWiseAtrUploadsQuery,
  ): Promise<ZoneWiseAtrUploadsApiResult> {
    const url = `${REVENUE_PROTECTION_ZONE_WISE_ATR_UPLOADS_PATH}?${buildZoneWiseAtrUploadsQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: ZoneWiseAtrUploadsResponse;
    try {
      responseBody = (await response.json()) as ZoneWiseAtrUploadsResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }

  async getZoneWiseAtrUploadsSummary(
    query: ZoneWiseAtrUploadsSummaryQuery,
  ): Promise<ZoneWiseAtrUploadsSummaryApiResult> {
    const url = `${REVENUE_PROTECTION_ZONE_WISE_ATR_UPLOADS_SUMMARY_PATH}?${buildZoneWiseAtrUploadsSummaryQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: ZoneWiseAtrUploadsSummaryResponse;
    try {
      responseBody = (await response.json()) as ZoneWiseAtrUploadsSummaryResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }
}
