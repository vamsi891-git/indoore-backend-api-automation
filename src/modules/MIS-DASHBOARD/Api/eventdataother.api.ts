import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventOtherApiResult = ApiCallResult;

export class EventOtherApi extends TimedApiClient {
  getOtherData(
    params: Record<string, string | number | boolean>,
  ): Promise<EventOtherApiResult> {
    return this.getJson("/indore/mis-dashboard/event-data/other", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
    });
  }
}
