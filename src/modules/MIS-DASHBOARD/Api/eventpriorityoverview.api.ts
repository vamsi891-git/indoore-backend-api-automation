import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventPriorityOverviewResult = ApiCallResult;

export class EventPriorityOverviewApi extends TimedApiClient {
  getPriorityOverview(
    params: Record<string, string | number | boolean> = {},
  ): Promise<EventPriorityOverviewResult> {
    return this.getJson("/indore/mis-dashboard/event-data/priority-wise", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
    });
  }
}
