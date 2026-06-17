import { APIRequestContext, APIResponse } from "@playwright/test";
import { LiveLoadProfileResponse } from "../Mapper/liveloadprofile.mapper";
import { getConsumerWithRetry } from "../utils/consumer-request.helper";
export interface LiveLoadProfileApiResult {
    rawResponse: APIResponse;
    responseBody:LiveLoadProfileResponse;
    responseTime: number;
}
export class LiveLoadProfileApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getLiveLoadProfile(consumerNumber: string): Promise<LiveLoadProfileApiResult> {
        const { rawResponse, responseTime } = await getConsumerWithRetry(
            this.authenticatedApi,
            `/indore/consumers/${consumerNumber}/live-load-profile`,
        );
        return {
            rawResponse,
            responseBody: await rawResponse.json(),
            responseTime,
        };
    }
}