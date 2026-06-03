// Api/eventclassification.api.ts
import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventClassificationResponse } from "../Mapper/eventclassification.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EventClassificationApiResponse {
  rawResponse: APIResponse;
  responseBody: EventClassificationResponse;
  responseTime: number;
}
export class EventClassificationApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getEventClassifications(): Promise<EventClassificationApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/event-classifications");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
