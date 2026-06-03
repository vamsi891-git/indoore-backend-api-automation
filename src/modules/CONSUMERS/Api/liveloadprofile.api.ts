import { APIRequestContext, APIResponse } from "@playwright/test";
import { LiveLoadProfileResponse } from "../Mapper/liveloadprofile.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface LiveLoadProfileApiResult {
    rawResponse: APIResponse;
    responseBody:LiveLoadProfileResponse;
    responseTime: number;
}
export class LiveLoadProfileApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getLiveLoadProfile(consumerNumber: string): Promise<LiveLoadProfileApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/live-load-profile`);
        return {
            rawResponse:response,
            responseBody:await response.json(),
            responseTime:Date.now() - start
        };
    }
}