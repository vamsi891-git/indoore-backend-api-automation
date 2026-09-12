import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { MinMaxVoltageResponse } from "../Mapper/minmaxvoltage.mapper";

export type MinMaxVoltageApiResult = ApiCallResult<MinMaxVoltageResponse>;

export type MinMaxVoltageType = "min" | "max";
export type MinMaxVoltagePhase = "R" | "Y" | "B";

export interface MinMaxVoltageQuery {
  meterPhaseTblRefId?: number;
  month?: number;
  year?: number;
  voltageType?: MinMaxVoltageType | string;
  phase?: MinMaxVoltagePhase | string;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  organisationLookupId?: number;
  networkLookupId?: number;
  [key: string]: string | number | boolean | undefined;
}

export class MinMaxVoltageApi extends TimedApiClient {
  getMinMaxVoltage(
    query: MinMaxVoltageQuery = {},
  ): Promise<MinMaxVoltageApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<MinMaxVoltageResponse>(
      "/indore/reports/min-max-voltage",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
