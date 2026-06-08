import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { BillingHistoryResponse } from "../Mapper/billinghistory.mapper";

export type BillingHistoryApiResult = ApiCallResult<BillingHistoryResponse>;

export class BillingHistoryApi extends TimedApiClient {
    getBillingHistory(consumerNumber: string): Promise<BillingHistoryApiResult> {
        return this.getJson<BillingHistoryResponse>(
            `/indore/consumers/${consumerNumber}/billing-history`,
        );
    }
}
