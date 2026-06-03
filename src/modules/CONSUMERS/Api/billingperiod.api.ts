import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { BillingPeriodResponse } from "../Mapper/billingperiod.mapper";

export type BillingPeriodApiResult = ApiCallResult<BillingPeriodResponse>;

export class BillingPeriodApi extends TimedApiClient {
  getBillingPeriod(consumerNumber: string): Promise<BillingPeriodApiResult> {
    return this.getJson<BillingPeriodResponse>(
      `/indore/consumers/${consumerNumber}/billing-period`
    );
  }
}
