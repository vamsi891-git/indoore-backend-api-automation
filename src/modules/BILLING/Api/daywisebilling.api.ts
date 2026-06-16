import { APIRequestContext, APIResponse} from "@playwright/test";
import { getBillingWithRetry } from "../utils/billing-request.helper";
import { DaywiseBillingResponse} from "../Mapper/daywisebilling.mapper";
export interface DaywiseBillingApiResponse {
    rawResponse: APIResponse;
    responseBody: DaywiseBillingResponse;
    responseTime: number;
}
export class DaywiseBillingApi {
    constructor(private authenticatedApi: APIRequestContext) {}
    async getDaywiseBillingData(
        month: number,
        year: number,
        includeTotal: boolean,
        page: number,
        limit: number
    ): Promise<DaywiseBillingApiResponse> {
        const { response: rawResponse, responseTime } = await getBillingWithRetry(
            this.authenticatedApi,
            `/indore/billing/daywise-billing-data?month=${month}&year=${year}&includeTotal=${includeTotal}&page=${page}&limit=${limit}`,
        );
        const responseBody = await rawResponse.json();

        return {
            rawResponse,
            responseBody,
            responseTime

        };

    }

}