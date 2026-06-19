import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export interface EventCurrentApiResult {
  rawResponse: APIResponse;
  responseBody: any;
  responseTime: number;
}

export class EventCurrentApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getCurrentData(
    params: Record<string, string | number | boolean>
  ): Promise<EventCurrentApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(
      this.authenticatedApi,
      "/indore/mis-dashboard/event-data/current",
      { params, timeout: MIS_SLOW_REQUEST_TIMEOUT_MS }
    );

    return {
      rawResponse: response,
      responseBody: await response.json(),
      responseTime: Date.now() - start
    };
  }
}
