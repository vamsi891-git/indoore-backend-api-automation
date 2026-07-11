import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventClassificationResponse } from "../Mapper/eventclassification.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface EventClassificationApiResponse {
  rawResponse: APIResponse;
  responseBody: EventClassificationResponse;
  responseTime: number;
}

export class EventClassificationApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getEventClassifications(): Promise<EventClassificationApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<EventClassificationResponse>(
        this.authenticatedApi,
        "/indore/utils/event-classifications",
        "event-classifications",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
