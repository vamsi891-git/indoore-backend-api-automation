// Api/eventpriority.api.ts
import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventPriorityResponse } from "../Mapper/eventpriority.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EventPriorityApiResponse {
  rawResponse: APIResponse;
  responseBody: EventPriorityResponse;
  responseTime: number;
}
export class EventPriorityApi {
    constructor(private authenticatedApi: APIRequestContext) {}
  async getEventPriorities(): Promise<EventPriorityApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/event-priorities");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
