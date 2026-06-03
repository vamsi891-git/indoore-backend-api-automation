import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventDetailResponse } from "../Mapper/eventdetail.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EventDetailApiResult {
  rawResponse: APIResponse;
  responseBody: EventDetailResponse;
  responseTime: number;
}
export class EventDetailApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}
  async getEventDetail(
    params: Record<string, string | number | boolean>,
  ): Promise<EventDetailApiResult> {
    const start = Date.now();
    const response = await getWithAutoRefresh(this.authenticatedApi,
      "/indore/reports/event-detail",
      { params },
    );
    const responseTime = Date.now() - start;
    if (!response.ok()) {
      throw new Error(`
        Status:
        ${response.status()}
        Body:
        ${await response.text()}
      `);
    }
    return {
      rawResponse: response,
      responseBody: await response.json(),
      responseTime,
    };
  }
}
