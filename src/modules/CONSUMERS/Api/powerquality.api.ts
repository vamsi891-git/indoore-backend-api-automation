import { APIRequestContext,  APIResponse } from "@playwright/test";
import { PowerQualityResponse } from "../Mapper/powerquality.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface PowerQualityApiResult {
    rawResponse: APIResponse;
    responseBody: PowerQualityResponse;
    responseTime: number;
}
export class PowerQualityApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getPowerQuality(consumerNumber: string): Promise<PowerQualityApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/power-quality`);
        return {
            rawResponse: response,
            responseBody:await response.json(),
            responseTime:Date.now() - start
        };
    }
}