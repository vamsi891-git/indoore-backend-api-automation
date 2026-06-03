// Api/event.api.ts
import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventResponse } from "../Mapper/event.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EventApiResponse {
  rawResponse: APIResponse;
  responseBody: EventResponse;
  responseTime: number;
}
export class EventApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getEvents(): Promise<EventApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/events");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
