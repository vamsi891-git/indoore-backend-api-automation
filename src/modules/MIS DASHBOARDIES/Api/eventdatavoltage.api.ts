import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventVoltageApiResult = ApiCallResult;

export class EventDataVoltageApi extends TimedApiClient {
  getVoltageData(
    params: Record<string, string | number | boolean>
  ): Promise<EventVoltageApiResult> {
    return this.getJson("/indore/mis-dashboard/event-data/voltage", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS
    });
  }
}
