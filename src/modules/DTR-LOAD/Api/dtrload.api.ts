import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { DTR_LOAD_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { DtrLoadResponse } from "../Mapper/dtrload.mapper";
import type { DtrLoadQuery } from "../Data/dtrload.data";

export type DtrLoadApiResult = ApiCallResult<DtrLoadResponse>;

export class DtrLoadApi extends TimedApiClient {
  getDtrLoad(query: DtrLoadQuery = {}): Promise<DtrLoadApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }
    return this.getJson<DtrLoadResponse>("/indore/dtr-load", {
      timeout: DTR_LOAD_REQUEST_TIMEOUT_MS,
      ...(Object.keys(params).length > 0 ? { params } : {}),
    });
  }
}
