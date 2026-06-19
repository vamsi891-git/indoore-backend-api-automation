import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { CommStatsResponse } from "../Mapper/communicationstats.mapper";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type CommStatsApiResult = ApiCallResult<CommStatsResponse>;

export class CommStatsApi extends TimedApiClient {
  getCommStats(
    params: Record<string, string | number | boolean>
  ): Promise<CommStatsApiResult> {
    return this.getJson<CommStatsResponse>("/indore/mis-dashboard/comm-stats", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS
    });
  }
}
