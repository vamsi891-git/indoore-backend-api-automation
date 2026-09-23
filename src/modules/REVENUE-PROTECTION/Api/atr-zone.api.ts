import { APIRequestContext, APIResponse } from "@playwright/test";
import { getRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import type { AtrZoneQuery, AtrZoneResponse } from "../Mapper/atr-zone.mapper";

export const REVENUE_PROTECTION_ATRZONE_PATH = "/indore/revenue-protection/atr-zone";

export interface AtrZoneApiResult {
  rawResponse: APIResponse;
  responseBody: AtrZoneResponse;
  responseTime: number;
}

/**
 * Live query shape (aberrations details report):
 * GET /indore/revenue-protection/atr-zone?year=2025&reportType=aberrations_details&page=1&limit=10
 */
export function buildAtrZoneQueryString(query: AtrZoneQuery): string {
  const params = new URLSearchParams();
  params.set("year", String(query.year));
  if (query.reportType !== undefined) {
    params.set("reportType", query.reportType);
  }
  if (query.month !== undefined) {
    params.set("month", String(query.month));
  }
  if (query.organisationLookupId !== undefined) {
    params.set("organisationLookupId", String(query.organisationLookupId));
  }
  if (query.networkLookupId !== undefined) {
    params.set("networkLookupId", String(query.networkLookupId));
  }
  if (query.feeder !== undefined) {
    params.set("feeder", String(query.feeder));
  }
  if (query.search !== undefined) {
    params.set("search", query.search);
  }
  if (query.source !== undefined) {
    params.set("source", query.source);
  }
  if (query.communicationStatus !== undefined) {
    params.set("communicationStatus", query.communicationStatus);
  }
  if (query.servicePointMeterPhaseTblRefId !== undefined) {
    params.set("servicePointMeterPhaseTblRefId", String(query.servicePointMeterPhaseTblRefId));
  }
  if (query.categoryTblRefId !== undefined) {
    params.set("categoryTblRefId", String(query.categoryTblRefId));
  }
  if (query.eventTblRefId !== undefined) {
    params.set("eventTblRefId", String(query.eventTblRefId));
  }
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 10));
  return params.toString();
}

export class AtrZoneApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getAtrZone(query: AtrZoneQuery): Promise<AtrZoneApiResult> {
    const url = `${REVENUE_PROTECTION_ATRZONE_PATH}?${buildAtrZoneQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: AtrZoneResponse;
    try {
      responseBody = (await response.json()) as AtrZoneResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }
}
