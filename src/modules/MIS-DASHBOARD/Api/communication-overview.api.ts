import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type CommunicationOverviewApiResult = ApiCallResult;

export class CommunicationOverviewApi extends TimedApiClient {
  getOverview(
    params: Record<string, string | number | boolean>,
  ): Promise<CommunicationOverviewApiResult> {
    return this.getJson("/indore/mis-dashboard/communication-overview", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
    });
  }
}
