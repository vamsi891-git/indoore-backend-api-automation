import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { formatMeterSerialsQueryParam } from "../../../core/utils/dedupe-serials.util";
import type { DtrBillingResponse } from "../Mapper/dtrbilling.mapper";

export type DtrBillingApiResult = ApiCallResult<DtrBillingResponse>;

export interface DtrBillingQuery {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  /** Optional filter — deduped before send to avoid duplicate-key temp-table failures. */
  meterSerialNumbers?: string[];
  organisationLookupId?: number;
  networkLookupId?: number;
  meterNumber?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export class DtrBillingApi extends TimedApiClient {
  getDtrBilling(query: DtrBillingQuery = {}): Promise<DtrBillingApiResult> {
    const params: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || key === "meterSerialNumbers") continue;
      params[key] = value as string | number | boolean;
    }

    const meterSerialNumbers = formatMeterSerialsQueryParam(
      query.meterSerialNumbers ?? [],
    );
    if (meterSerialNumbers) {
      params.meterSerialNumbers = meterSerialNumbers;
    }

    return this.getJson<DtrBillingResponse>("/indore/reports/dtr-billing", {
      timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
      ...(Object.keys(params).length > 0 ? { params } : {}),
    });
  }
}
