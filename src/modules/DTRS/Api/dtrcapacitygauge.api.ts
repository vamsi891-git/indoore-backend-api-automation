import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrCapacityGaugeResponse } from "../Mapper/dtrcapacitygauge.mapper";

export type DtrCapacityGaugeApiResult = ApiCallResult<DtrCapacityGaugeResponse>;

export interface DtrCapacityGaugeQuery {
  [key: string]: string | number | boolean | undefined;
}

export class DtrCapacityGaugeApi extends TimedApiClient {
  getCapacityGauge(
    dtrCode: string,
    query: DtrCapacityGaugeQuery = {},
  ): Promise<DtrCapacityGaugeApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrCapacityGaugeResponse>(
      `/indore/dtr/${encodeURIComponent(dtrCode)}/capacity-gauge`,
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
