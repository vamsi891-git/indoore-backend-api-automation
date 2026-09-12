import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { BillStatusResponse } from "../Mapper/billstatus.mapper";

export type BillStatusApiResult = ApiCallResult<BillStatusResponse>;

export interface BillStatusQuery {
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  organisationLookupId?: number;
  networkLookupId?: number;
  meterSerialNumber?: string;
  ivrsNumber?: string;
  [key: string]: string | number | boolean | undefined;
}

export class BillStatusApi extends TimedApiClient {
  getBillStatus(query: BillStatusQuery = {}): Promise<BillStatusApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<BillStatusResponse>("/indore/reports/bill-status", {
      timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
      ...(Object.keys(params).length > 0 ? { params } : {}),
    });
  }
}
