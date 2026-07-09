import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrFeedersResponse } from "../Mapper/dtrfeeders.mapper";

export type DtrFeedersApiResult = ApiCallResult<DtrFeedersResponse>;

export interface DtrFeedersQuery {
  [key: string]: string | number | boolean | undefined;
}

export class DtrFeedersApi extends TimedApiClient {
  getFeeders(
    dtrCode: string,
    query: DtrFeedersQuery = {},
  ): Promise<DtrFeedersApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrFeedersResponse>(
      `/indore/dtr/${encodeURIComponent(dtrCode)}/feeders`,
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
