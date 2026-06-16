import { APIRequestContext,  APIResponse }  from "@playwright/test";
import {  EnergyFlowResponse}  from "../Mapper/energyflow.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EnergyFlowApiResult {
    rawResponse: APIResponse;
    responseBody:EnergyFlowResponse;
    responseTime: number;
}
export class EnergyFlowApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getEnergyFlow(consumerNumber: string): Promise<EnergyFlowApiResult> {
        const start = Date.now();
        let response =await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/energy-flow`);
        if (response.status() === 504) {
            response = await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/energy-flow`);
        }
        return {
            rawResponse:response,
            responseBody:await response.json(),
            responseTime:Date.now() - start
        };
    }
}