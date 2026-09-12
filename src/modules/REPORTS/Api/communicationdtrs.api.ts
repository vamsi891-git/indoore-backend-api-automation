import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { CommunicationDtrsResponse } from "../Mapper/communicationdtrs.mapper";

export type CommunicationDtrsApiResult = ApiCallResult<CommunicationDtrsResponse>;

export type CommunicationDtrsPeriodType = "day" | "month" | "range" | string;

export interface CommunicationDtrsQuery {
  periodType?: CommunicationDtrsPeriodType;
  date?: string;
  month?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export class CommunicationDtrsApi extends TimedApiClient {
  getCommunicationDtrs(
    query: CommunicationDtrsQuery = {},
  ): Promise<CommunicationDtrsApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<CommunicationDtrsResponse>(
      "/indore/reports/communication/dtrs",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
