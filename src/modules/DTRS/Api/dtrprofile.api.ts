import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrProfileResponse } from "../Mapper/dtrprofile.mapper";

export type DtrProfileApiResult = ApiCallResult<DtrProfileResponse>;

export interface DtrProfileQuery {
  [key: string]: string | number | boolean | undefined;
}

export class DtrProfileApi extends TimedApiClient {
  getProfile(
    dtrCode: string,
    query: DtrProfileQuery = {},
  ): Promise<DtrProfileApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrProfileResponse>(
      `/indore/dtr/${encodeURIComponent(dtrCode)}/profile`,
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
