import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventPriorityResponse } from "../Mapper/eventpriority.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface EventPriorityApiResponse {
  rawResponse: APIResponse;
  responseBody: EventPriorityResponse;
  responseTime: number;
}

export class EventPriorityApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getEventPriorities(): Promise<EventPriorityApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<EventPriorityResponse>(
        this.authenticatedApi,
        "/indore/utils/event-priorities",
        "event-priorities",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
