import { APIRequestContext, APIResponse} from "@playwright/test";
import { getWithAutoRefresh} from "../../../core/utils/authenticated.request";
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
        const start = Date.now();
        const rawResponse =await getWithAutoRefresh(this.authenticatedApi,`/indore/billing/daywise-billing-data?month=${month}&year=${year}&includeTotal=${includeTotal}&page=${page}&limit=${limit}`
);
        const responseBody = await rawResponse.json();
        const responseTime =  Date.now() - start;

        return {
            rawResponse,
            responseBody,
            responseTime

        };

    }

}