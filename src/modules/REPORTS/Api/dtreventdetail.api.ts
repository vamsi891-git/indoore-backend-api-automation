import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { DtrEventDetailResponse } from "../Mapper/dtreventdetail.mapper";

export type DtrEventDetailApiResult = ApiCallResult<DtrEventDetailResponse>;

export interface DtrEventDetailQuery {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  organisationLookupId?: number;
  networkLookupId?: number;
  [key: string]: string | number | boolean | undefined;
}

export class DtrEventDetailApi extends TimedApiClient {
  getDtrEventDetail(
    query: DtrEventDetailQuery = {},
  ): Promise<DtrEventDetailApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrEventDetailResponse>(
      "/indore/reports/dtr-event-detail",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
