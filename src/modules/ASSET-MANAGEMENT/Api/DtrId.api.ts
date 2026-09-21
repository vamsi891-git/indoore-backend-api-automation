import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { DtrDetailResponse } from "../Mapper/dtrId.mapper";

export type DtrDetailApiResult = ApiCallResult<DtrDetailResponse>;

export class DtrDetailApi extends TimedApiClient {
  getDtrDetails(dtrId: number, page: number, limit: number): Promise<DtrDetailApiResult> {
    return this.getJson<DtrDetailResponse>(
      `/indore/asset-management/dtr/${dtrId}?page=${page}&limit=${limit}`,
      { timeout: DEFAULT_REQUEST_TIMEOUT_MS },
    );
  }
}
