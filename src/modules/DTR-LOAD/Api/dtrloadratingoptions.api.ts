import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { DTR_LOAD_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { DtrLoadRatingOptionsResponse } from "../Mapper/dtrloadratingoptions.mapper";
import type { DtrLoadRatingOptionsQuery } from "../Data/dtrloadratingoptions.data";

export type DtrLoadRatingOptionsApiResult =
  ApiCallResult<DtrLoadRatingOptionsResponse>;

export class DtrLoadRatingOptionsApi extends TimedApiClient {
  getRatingOptions(
    query: DtrLoadRatingOptionsQuery = {},
  ): Promise<DtrLoadRatingOptionsApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }
    return this.getJson<DtrLoadRatingOptionsResponse>(
      "/indore/dtr-load/rating-options",
      {
        timeout: DTR_LOAD_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
