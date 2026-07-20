import { APIRequestContext, APIResponse } from "@playwright/test";
import { getRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import {
  AberrationsQuery,
  AberrationsResponse,
} from "../Mapper/aberrations.mapper";

export const REVENUE_PROTECTION_ABERRATIONS_PATH =
  "/indore/revenue-protection/aberrations";

export interface AberrationsApiResult {
  rawResponse: APIResponse;
  responseBody: AberrationsResponse;
  responseTime: number;
}

export function buildAberrationsQueryString(query: AberrationsQuery): string {
  const params = new URLSearchParams();
  params.set("organisationLookupId", String(query.organisationLookupId));
  params.set("month", String(query.month));
  params.set("year", String(query.year));
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

export class AberrationsApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getAberrationSummary(
    query: AberrationsQuery,
  ): Promise<AberrationsApiResult> {
    const url = `${REVENUE_PROTECTION_ABERRATIONS_PATH}?${buildAberrationsQueryString(query)}`;

    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );

    let responseBody: AberrationsResponse;
    try {
      responseBody = (await response.json()) as AberrationsResponse;
    } catch {
      responseBody = { success: false } as AberrationsResponse;
    }

    return { rawResponse: response, responseBody, responseTime };
  }
}
