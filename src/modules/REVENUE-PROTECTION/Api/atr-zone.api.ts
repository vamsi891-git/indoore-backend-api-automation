import { APIRequestContext, APIResponse } from "@playwright/test";
import { getRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import type { AtrZoneQuery, AtrZoneResponse } from "../Mapper/atr-zone.mapper";

export const REVENUE_PROTECTION_ATRZONE_PATH =
  "/indore/revenue-protection/atr-zone";

export interface AtrZoneApiResult {
  rawResponse: APIResponse;
  responseBody: AtrZoneResponse;
  responseTime: number;
}

/**
 * Confirmed live query shape: year, page, limit only (no month — see data file
 * comment). Optional filters mirrored from Cases' builder pattern
 * (organisationLookupId, servicePointMeterPhaseTblRefId, categoryTblRefId,
 * eventTblRefId) since AtrZoneQuery in revenue-protection.schemas.js was not
 * provided — CONFIRM these optional filters actually exist on this endpoint
 * before relying on tests that set them.
 */
export function buildAtrZoneQueryString(query: AtrZoneQuery): string {
  const params = new URLSearchParams();
  params.set("year", String(query.year));
  if (query.organisationLookupId !== undefined) {
    params.set("organisationLookupId", String(query.organisationLookupId));
  }
  if (query.servicePointMeterPhaseTblRefId !== undefined) {
    params.set(
      "servicePointMeterPhaseTblRefId",
      String(query.servicePointMeterPhaseTblRefId),
    );
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