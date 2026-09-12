import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { DtrDataResponse } from "../Mapper/dtrdata.mapper";

export type DtrDataApiResult = ApiCallResult<DtrDataResponse>;

export type DtrDataReportType = "dp" | "ls" | "ip" | string;

export interface DtrDataQuery {
  fromDate?: string;
  toDate?: string;
  reportType?: DtrDataReportType;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  organisationLookupId?: number;
  networkLookupId?: number;
  meterSerialNumber?: string;
  [key: string]: string | number | boolean | undefined;
}

export class DtrDataApi extends TimedApiClient {
  getDtrData(query: DtrDataQuery = {}): Promise<DtrDataApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<DtrDataResponse>("/indore/reports/dtr-data", {
      timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
      ...(Object.keys(params).length > 0 ? { params } : {}),
    });
  }
}
