import { APIRequestContext, APIResponse } from "@playwright/test";
import { getRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import type { CasesQuery, CasesResponse } from "../Mapper/cases.mapper";

/** Aberration case-detail grid (sibling of /aberrations summary). */
export const REVENUE_PROTECTION_CASES_PATH =
  "/indore/revenue-protection/aberrations/detail";

export interface CasesApiResult {
  rawResponse: APIResponse;
  responseBody: CasesResponse;
  responseTime: number;
}

/**
 * Confirmed live query shape: month, year, page, limit.
 * Optional filters are only appended when provided.
 */
export function buildCasesQueryString(query: CasesQuery): string {
  const params = new URLSearchParams();
  params.set("month", String(query.month));
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

export class CasesApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getCases(query: CasesQuery): Promise<CasesApiResult> {
    const url = `${REVENUE_PROTECTION_CASES_PATH}?${buildCasesQueryString(query)}`;

    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );

    let responseBody: CasesResponse;
    try {
      responseBody = (await response.json()) as CasesResponse;
    } catch {
      responseBody = { success: false };
    }

    return { rawResponse: response, responseBody, responseTime };
  }
}
