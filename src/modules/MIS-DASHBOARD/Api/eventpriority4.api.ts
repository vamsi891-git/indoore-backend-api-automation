import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventPriorityApiResult = ApiCallResult;

export class EventPriorityApi extends TimedApiClient {
  getPriorityData(
    priority: string,
    params: Record<string, string | number | boolean> = {},
  ): Promise<EventPriorityApiResult> {
    return this.getJson(
      `/indore/mis-dashboard/event-data/priority-wise/${priority}`,
      {
        params,
        timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
      },
    );
  }
}
