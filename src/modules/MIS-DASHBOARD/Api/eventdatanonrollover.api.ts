import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventNonRolloverApiResult = ApiCallResult;

export class EventNonRolloverApi extends TimedApiClient {
  getNonRolloverData(
    params: Record<string, string | number | boolean>,
  ): Promise<EventNonRolloverApiResult> {
    return this.getJson("/indore/mis-dashboard/event-data/non-rollover-control", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
    });
  }
}
