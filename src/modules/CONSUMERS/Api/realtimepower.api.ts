import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { RealTimePowerResponse } from "../Mapper/realtimepower.mapper";

export type RealTimePowerApiResult = ApiCallResult<RealTimePowerResponse>;

export interface RealTimePowerQuery {
  [key: string]: string | number | boolean | undefined;
}

export class RealTimePowerApi extends TimedApiClient {
  getRealTimePower(
    consumerRef: string,
    query: RealTimePowerQuery = {},
  ): Promise<RealTimePowerApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<RealTimePowerResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/real-time-power`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
