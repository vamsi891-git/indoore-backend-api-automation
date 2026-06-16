import { APIRequestContext, APIResponse } from "@playwright/test";
import { getBillingWithRetry } from "../utils/billing-request.helper";
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
        const { response: rawResponse, responseTime } = await getBillingWithRetry(
            this.authenticatedApi,
            `/indore/billing/billing-data?month=${month}&year=${year}&page=${page}&limit=${limit}`,
        );
        const responseBody = await rawResponse.json();
        return {
            rawResponse,
            responseBody,
            responseTime
        };
    }
}