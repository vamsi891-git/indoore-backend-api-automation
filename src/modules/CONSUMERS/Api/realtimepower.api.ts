import { APIRequestContext, APIResponse } from "@playwright/test";
import { RealTimePowerResponse } from "../Mapper/realtimepower.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface RealTimePowerApiResult {
    rawResponse: APIResponse;
    responseBody: RealTimePowerResponse;
    responseTime: number;
}
export class RealTimePowerApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getRealTimePower(consumerNumber: string): Promise<RealTimePowerApiResult> {
        const start = Date.now();
        let response =await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/real-time-power`);
        if (response.status() === 504) {
            response = await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/real-time-power`);
        }
        return {
            rawResponse: response,
            responseBody:await response.json(),
            responseTime:Date.now() - start
        };
    }
}