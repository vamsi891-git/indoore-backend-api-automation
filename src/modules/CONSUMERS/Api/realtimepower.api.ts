import { APIRequestContext, APIResponse } from "@playwright/test";
import { RealTimePowerResponse } from "../Mapper/realtimepower.mapper";
import { getConsumerWithRetry } from "../utils/consumer-request.helper";
export interface RealTimePowerApiResult {
    rawResponse: APIResponse;
    responseBody: RealTimePowerResponse;
    responseTime: number;
}
export class RealTimePowerApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getRealTimePower(consumerNumber: string): Promise<RealTimePowerApiResult> {
        const { rawResponse, responseTime } = await getConsumerWithRetry(
            this.authenticatedApi,
            `/indore/consumers/${consumerNumber}/real-time-power`,
        );
        return {
            rawResponse,
            responseBody: await rawResponse.json(),
            responseTime,
        };
    }
}