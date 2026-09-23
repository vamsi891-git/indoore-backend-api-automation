import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  getRevenueProtectionWithRetry,
  postRevenueProtectionWithRetry,
} from "../utils/revenue-protection-request.helper";
import type {
  ZoneWiseAtrEventsImportInput,
  ZoneWiseAtrEventsImportResponse,
  ZoneWiseAtrEventsQuery,
  ZoneWiseAtrEventsResponse,
} from "../Mapper/zone-wise-atr-events.types";

export const REVENUE_PROTECTION_ZONE_WISE_ATR_EVENTS_PATH =
  "/indore/revenue-protection/zone-wise-atr-events";

export const REVENUE_PROTECTION_ZONE_WISE_ATR_EVENTS_IMPORT_PATH = `${REVENUE_PROTECTION_ZONE_WISE_ATR_EVENTS_PATH}/import`;

export interface ZoneWiseAtrEventsApiResult {
  rawResponse: APIResponse;
  responseBody: ZoneWiseAtrEventsResponse;
  responseTime: number;
}

export interface ZoneWiseAtrEventsImportApiResult {
  rawResponse: APIResponse;
  responseBody: ZoneWiseAtrEventsImportResponse;
  responseTime: number;
}

export function buildZoneWiseAtrEventsQueryString(query: ZoneWiseAtrEventsQuery): string {
  const params = new URLSearchParams();
  params.set("month", String(query.month));
  params.set("year", String(query.year));
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));
  return params.toString();
}

export class ZoneWiseAtrEventsApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getZoneWiseAtrEvents(query: ZoneWiseAtrEventsQuery): Promise<ZoneWiseAtrEventsApiResult> {
    const url = `${REVENUE_PROTECTION_ZONE_WISE_ATR_EVENTS_PATH}?${buildZoneWiseAtrEventsQueryString(query)}`;
    const { response, responseTime } = await getRevenueProtectionWithRetry(
      this.authenticatedApi,
      url,
    );
    let responseBody: ZoneWiseAtrEventsResponse;
    try {
      responseBody = (await response.json()) as ZoneWiseAtrEventsResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }

  /**
   * Multipart import — requires file + month/year (or meta JSON).
   * Live: POST /revenue-protection/zone-wise-atr-events/import
   */
  async importZoneWiseAtrEvents(
    input: ZoneWiseAtrEventsImportInput,
  ): Promise<ZoneWiseAtrEventsImportApiResult> {
    const { response, responseTime } = await postRevenueProtectionWithRetry(
      this.authenticatedApi,
      REVENUE_PROTECTION_ZONE_WISE_ATR_EVENTS_IMPORT_PATH,
      {
        multipart: {
          file: {
            name: input.fileName,
            mimeType: input.mimeType,
            buffer: input.buffer,
          },
          month: String(input.month),
          year: String(input.year),
        },
      },
    );
    let responseBody: ZoneWiseAtrEventsImportResponse;
    try {
      responseBody = (await response.json()) as ZoneWiseAtrEventsImportResponse;
    } catch {
      responseBody = { success: false };
    }
    return { rawResponse: response, responseBody, responseTime };
  }
}
