import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventDataApiResult = ApiCallResult;

export class EventDataApi extends TimedApiClient {
  getEventData(
    params: Record<string, string | number | boolean>,
  ): Promise<EventDataApiResult> {
    return this.getJson("/indore/mis-dashboard/event-data", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
    });
  }
}
