import { APIRequestContext, APIResponse } from "@playwright/test";
import { CONSUMPTION_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DayNightResponse } from "../Mapper/daynight.mapper";
import { getCommercialWithRetry } from "../utils/commercial-request.helper";

export interface DayNightApiResult {
  rawResponse: APIResponse;
  responseBody: DayNightResponse;
  responseTime: number;
}

export class DayNightApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getDayNight(
    params: Record<string, string | number | boolean>,
  ): Promise<DayNightApiResult> {
    const { response, responseTime } = await getCommercialWithRetry(
      this.authenticatedApi,
      "/indore/analysis/commercial/day-night",
      { params },
      {
        maxAttempts: 5,
        timeoutMs: CONSUMPTION_REQUEST_TIMEOUT_MS,
        exponentialBackoff: true,
      },
    );

    const responseBody = (await response
      .json()
      .catch(() => ({}))) as DayNightResponse;

    return {
      rawResponse: response,
      responseBody,
      responseTime,
    };
  }
}
