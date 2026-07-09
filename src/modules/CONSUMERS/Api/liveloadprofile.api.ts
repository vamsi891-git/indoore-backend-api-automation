import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { LiveLoadProfileResponse } from "../Mapper/liveloadprofile.mapper";

export type LiveLoadProfileApiResult = ApiCallResult<LiveLoadProfileResponse>;

export interface LiveLoadProfileQuery {
  [key: string]: string | number | boolean | undefined;
}

export class LiveLoadProfileApi extends TimedApiClient {
  getLiveLoadProfile(
    consumerRef: string,
    query: LiveLoadProfileQuery = {},
  ): Promise<LiveLoadProfileApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<LiveLoadProfileResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/live-load-profile`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
