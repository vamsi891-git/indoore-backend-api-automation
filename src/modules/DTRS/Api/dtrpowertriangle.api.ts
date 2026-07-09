import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrPowerTriangleResponse } from "../Mapper/dtrpowertriangle.mapper";

export type DtrPowerTriangleApiResult = ApiCallResult<DtrPowerTriangleResponse>;

export interface DtrPowerTriangleQuery {
  [key: string]: string | number | boolean | undefined;
}

export class DtrPowerTriangleApi extends TimedApiClient {
  getPowerTriangle(
    dtrCode: string,
    query: DtrPowerTriangleQuery = {},
  ): Promise<DtrPowerTriangleApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrPowerTriangleResponse>(
      `/indore/dtr/${encodeURIComponent(dtrCode)}/power-triangle`,
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
