import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  getRevenueProtectionWithRetry,
  requestRevenueProtectionWithRetry,
} from "../utils/revenue-protection-request.helper";
import type {
  AberrationEntryQuery,
  AberrationEntryResponse,
  AberrationEntryType,
} from "../Mapper/aberration-entry.mapper";
import type {
  AberrationEntryByIvrsResponse,
  AberrationEntryUpdatePayload,
} from "../Mapper/aberration-entry-by-ivrs.mapper";
import { REVENUE_PROTECTION_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export const REVENUE_PROTECTION_ABERRATION_ENTRY_BASE =
  "/indore/revenue-protection/aberration-entry";

export function resolveAberrationEntryPath(
  entryType: AberrationEntryType = "zone",
): string {
  return `${REVENUE_PROTECTION_ABERRATION_ENTRY_BASE}/${entryType}`;
}

/**
 * Live update/lookup path:
 * PATCH /indore/revenue-protection/aberration-entry/:ivrsNo
 *
 * Note: GET on this path is not registered on the current API gateway
 * (Express "Cannot GET"). Success body for PATCH is { ivrsNo }.
 */
export function resolveAberrationEntryByIvrsPath(ivrsNo: string): string {
  return `${REVENUE_PROTECTION_ABERRATION_ENTRY_BASE}/${encodeURIComponent(ivrsNo.trim())}`;
}

export const REVENUE_PROTECTION_ABERRATION_ENTRY_PATH =
  resolveAberrationEntryPath("zone");

export interface AberrationEntryApiResult {
  rawResponse: APIResponse;
  responseBody: AberrationEntryResponse;
  responseTime: number;
}

export interface AberrationEntryByIvrsApiResult {
  rawResponse: APIResponse;
  responseBody: AberrationEntryByIvrsResponse;
  responseTime: number;
}

export function buildAberrationEntryQueryString(
  query: AberrationEntryQuery,
): string {
  const params = new URLSearchParams();
  if (query.month !== undefined && query.month !== "") {
    params.set("month", String(query.month));
  }
  if (query.year !== undefined && query.year !== "") {
    params.set("year", String(query.year));
  }
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 10));
  return params.toString();
}

export class AberrationEntryApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getAberrationEntry(
    query: AberrationEntryQuery,
  ): Promise<AberrationEntryApiResult> {
    const entryType = query.entryType ?? "zone";
    const url = `${resolveAberrationEntryPath(entryType)}?${buildAberrationEntryQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: AberrationEntryResponse;
    try {
      responseBody = (await response.json()) as AberrationEntryResponse;
    } catch {
      responseBody = { success: false } as AberrationEntryResponse;
    }
    return { rawResponse: response, responseBody, responseTime };
  }

  /**
   * PATCH /indore/revenue-protection/aberration-entry/:ivrsNo
   *
   * Backend flow:
   * 1) findAberrationEntryUuidByIvrs(ivrsNo, claims)
   * 2) updateAberrationEntryRow(uuid, payload, updatedBy)
   * 3) return { ivrsNo }
   */
  async patchAberrationEntryByIvrs(
    ivrsNo: string,
    payload: AberrationEntryUpdatePayload,
  ): Promise<AberrationEntryByIvrsApiResult> {
    const url = resolveAberrationEntryByIvrsPath(ivrsNo);
    const start = Date.now();
    const response = await requestRevenueProtectionWithRetry(() =>
      this.authenticatedApi.patch(url, {
        data: payload,
        timeout: REVENUE_PROTECTION_REQUEST_TIMEOUT_MS,
      }),
    );
    let responseBody: AberrationEntryByIvrsResponse;
    try {
      responseBody = (await response.json()) as AberrationEntryByIvrsResponse;
    } catch {
      responseBody = { success: false } as AberrationEntryByIvrsResponse;
    }
    return {
      rawResponse: response,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
