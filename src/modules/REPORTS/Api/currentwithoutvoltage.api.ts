import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { CurrentWithoutVoltageResponse } from "../Mapper/currentwithoutvoltage.mapper";

export type CurrentWithoutVoltageApiResult =
  ApiCallResult<CurrentWithoutVoltageResponse>;

export type CurrentWithoutVoltagePhase = "R" | "Y" | "B";

export interface CurrentWithoutVoltageQuery {
  phase?: CurrentWithoutVoltagePhase | string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  meterPhaseTblRefId?: number;
  organisationLookupId?: number;
  networkLookupId?: number;
  meterSerialNumber?: string;
  ivrsNumber?: string;
  [key: string]: string | number | boolean | undefined;
}

export class CurrentWithoutVoltageApi extends TimedApiClient {
  getCurrentWithoutVoltage(
    query: CurrentWithoutVoltageQuery = {},
  ): Promise<CurrentWithoutVoltageApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<CurrentWithoutVoltageResponse>(
      "/indore/reports/current-without-voltage",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
