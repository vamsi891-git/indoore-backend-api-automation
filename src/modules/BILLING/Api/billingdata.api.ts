import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh} from "../../../core/utils/authenticated.request";
import { BillingDataResponse } from "../Mapper/billingdata.mapper";
export interface BillingApiResponse {
    rawResponse: APIResponse;
    responseBody: BillingDataResponse;
    responseTime: number;
}
export class BillingDataApi {
    constructor(private authenticatedApi: APIRequestContext) { }
    async getBillingData(
        month: number,
        year: number,
        page: number,
        limit: number
    ): Promise<BillingApiResponse> {
        const start = Date.now();
        const rawResponse =await getWithAutoRefresh(this.authenticatedApi,`/indore/billing/billing-data?month=${month}&year=${year}&page=${page}&limit=${limit}`);
        const responseBody =await rawResponse.json();
        const responseTime =Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };
    }
}