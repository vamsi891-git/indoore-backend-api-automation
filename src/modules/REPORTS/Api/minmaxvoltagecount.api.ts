import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { MinMaxVoltageCountResponse } from "../Mapper/minmaxvoltagecount.mapper";

export type MinMaxVoltageCountApiResult =
  ApiCallResult<MinMaxVoltageCountResponse>;

export interface MinMaxVoltageCountQuery {
  meterPhaseTblRefId?: number;
  month?: number;
  year?: number;
  voltageType?: string;
  phase?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export class MinMaxVoltageCountApi extends TimedApiClient {
  getMinMaxVoltageCount(
    query: MinMaxVoltageCountQuery = {},
  ): Promise<MinMaxVoltageCountApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<MinMaxVoltageCountResponse>(
      "/indore/reports/min-max-voltage/count",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
