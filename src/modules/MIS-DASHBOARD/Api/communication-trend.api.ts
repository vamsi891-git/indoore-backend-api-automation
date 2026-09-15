import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type CommunicationTrendApiResult = ApiCallResult;

export class CommunicationTrendApi extends TimedApiClient {
  getTrend(
    params: Record<string, string | number | boolean>,
  ): Promise<CommunicationTrendApiResult> {
    return this.getJson("/indore/mis-dashboard/communication-trend", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
    });
  }
}
