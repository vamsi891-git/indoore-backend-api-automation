import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventClassificationResponse } from "../Mapper/eventclassification.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface EventClassificationApiResponse {
  rawResponse: APIResponse;
  responseBody: EventClassificationResponse;
  responseTime: number;
}

export class EventClassificationApi {
  static readonly PATH = "/indore/utils/event-classifications";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getEventClassifications(): Promise<EventClassificationApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<EventClassificationResponse>(
        this.authenticatedApi,
        EventClassificationApi.PATH,
        "event-classifications",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
