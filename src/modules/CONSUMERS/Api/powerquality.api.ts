import { APIRequestContext,  APIResponse } from "@playwright/test";
import { PowerQualityResponse } from "../Mapper/powerquality.mapper";
import { getConsumerWithRetry } from "../utils/consumer-request.helper";
export interface PowerQualityApiResult {
    rawResponse: APIResponse;
    responseBody: PowerQualityResponse;
    responseTime: number;
}
export class PowerQualityApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getPowerQuality(consumerNumber: string): Promise<PowerQualityApiResult> {
        const { rawResponse, responseTime } = await getConsumerWithRetry(
            this.authenticatedApi,
            `/indore/consumers/${consumerNumber}/power-quality`,
        );
        return {
            rawResponse,
            responseBody: await rawResponse.json(),
            responseTime,
        };
    }
}