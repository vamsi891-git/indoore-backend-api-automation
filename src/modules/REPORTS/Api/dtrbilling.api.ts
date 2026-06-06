import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";

export class DtrBillingApi extends TimedApiClient {
    getDtrBilling(
        fromDate: string,
        toDate: string,
        page: number,
        limit: number,
        includeTotal: boolean,
    ): Promise<ApiCallResult> {
        return this.getJson("/indore/reports/dtr-billing", {
            params: {
                fromDate,
                toDate,
                page,
                limit,
                includeTotal,
            },
        });
    }
}
