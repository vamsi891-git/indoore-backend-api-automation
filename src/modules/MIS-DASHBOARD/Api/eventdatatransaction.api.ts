import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventTransactionApiResult = ApiCallResult;

export class EventTransactionApi extends TimedApiClient {
  getTransactionData(params: Record<string, string>): Promise<EventTransactionApiResult> {
    return this.getJson("/indore/mis-dashboard/event-data/transaction", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS
    });
  }
}
