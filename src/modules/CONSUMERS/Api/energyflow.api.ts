import { APIRequestContext,  APIResponse }  from "@playwright/test";
import {  EnergyFlowResponse}  from "../Mapper/energyflow.mapper";
import { getConsumerWithRetry } from "../utils/consumer-request.helper";
export interface EnergyFlowApiResult {
    rawResponse: APIResponse;
    responseBody:EnergyFlowResponse;
    responseTime: number;
}
export class EnergyFlowApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getEnergyFlow(consumerNumber: string): Promise<EnergyFlowApiResult> {
        const { rawResponse, responseTime } = await getConsumerWithRetry(
            this.authenticatedApi,
            `/indore/consumers/${consumerNumber}/energy-flow`,
        );
        return {
            rawResponse,
            responseBody: await rawResponse.json(),
            responseTime,
        };
    }
}