import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { BillingHistoryResponse } from "../Mapper/billinghistory.mapper";

export type BillingHistoryApiResult = ApiCallResult<BillingHistoryResponse>;

export interface BillingHistoryQuery {
  billingLimit?: number;
  [key: string]: string | number | boolean | undefined;
}

export class BillingHistoryApi extends TimedApiClient {
  getBillingHistory(
    consumerRef: string,
    query: BillingHistoryQuery = { billingLimit: 0 },
  ): Promise<BillingHistoryApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<BillingHistoryResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/billing-history`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
