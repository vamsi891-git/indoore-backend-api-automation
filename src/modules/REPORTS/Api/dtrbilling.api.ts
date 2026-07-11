import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { formatMeterSerialsQueryParam } from "../../../core/utils/dedupe-serials.util";

export interface DtrBillingQuery {
  fromDate: string;
  toDate: string;
  page: number;
  limit: number;
  includeTotal: boolean;
  /** Optional filter — deduped before send to avoid duplicate-key temp-table failures. */
  meterSerialNumbers?: string[];
  organisationLookupId?: number;
  networkLookupId?: number;
  meterNumber?: string;
}

export class DtrBillingApi extends TimedApiClient {
  getDtrBilling(query: DtrBillingQuery): Promise<ApiCallResult> {
    const params: Record<string, string | number | boolean> = {
      fromDate: query.fromDate,
      toDate: query.toDate,
      page: query.page,
      limit: query.limit,
      includeTotal: query.includeTotal,
    };

    const meterSerialNumbers = formatMeterSerialsQueryParam(
      query.meterSerialNumbers ?? [],
    );
    if (meterSerialNumbers) {
      params.meterSerialNumbers = meterSerialNumbers;
    }
    if (query.organisationLookupId !== undefined) {
      params.organisationLookupId = query.organisationLookupId;
    }
    if (query.networkLookupId !== undefined) {
      params.networkLookupId = query.networkLookupId;
    }
    if (query.meterNumber !== undefined) {
      params.meterNumber = query.meterNumber;
    }

    return this.getJson("/indore/reports/dtr-billing", { params });
  }
}
