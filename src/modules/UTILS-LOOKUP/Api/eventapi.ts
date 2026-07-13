import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventResponse } from "../Mapper/event.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface EventApiResponse {
  rawResponse: APIResponse;
  responseBody: EventResponse;
  responseTime: number;
}

export class EventApi {
  static readonly PATH = "/indore/utils/events";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getEvents(): Promise<EventApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<EventResponse>(
        this.authenticatedApi,
        EventApi.PATH,
        "events",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
