import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { PowerQualityResponse } from "../Mapper/powerquality.mapper";

export type PowerQualityApiResult = ApiCallResult<PowerQualityResponse>;

export interface PowerQualityQuery {
  [key: string]: string | number | boolean | undefined;
}

export class PowerQualityApi extends TimedApiClient {
  getPowerQuality(
    consumerRef: string,
    query: PowerQualityQuery = {},
  ): Promise<PowerQualityApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<PowerQualityResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/power-quality`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
