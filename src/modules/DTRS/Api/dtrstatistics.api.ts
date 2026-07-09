import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrStatisticsResponse } from "../Mapper/dtrstatistics.mapper";

export type DtrStatisticsApiResult = ApiCallResult<DtrStatisticsResponse>;

export interface DtrStatisticsQuery {
  [key: string]: string | number | boolean | undefined;
}

export class DtrStatisticsApi extends TimedApiClient {
  getDtrStatistics(
    dtrCode: string,
    query: DtrStatisticsQuery = {},
  ): Promise<DtrStatisticsApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrStatisticsResponse>(
      `/indore/dtr/${encodeURIComponent(dtrCode)}/statistics`,
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
