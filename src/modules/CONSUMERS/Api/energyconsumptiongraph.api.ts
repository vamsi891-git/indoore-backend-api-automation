import { APIRequestContext, APIResponse } from "@playwright/test";
import { EnergyConsumptionGraphResponse } from "../Mapper/energyconsumptiongraph.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EnergyConsumptionGraphApiResult {
    rawResponse: APIResponse;
    responseBody:EnergyConsumptionGraphResponse;
    responseTime: number;
}
export class EnergyConsumptionGraphApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getEnergyConsumptionGraph(consumerNumber: string): Promise<EnergyConsumptionGraphApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/energy-consumption-graph`);
        return {
            rawResponse:response,
            responseBody:await response.json(),
            responseTime:Date.now() - start
        };
    }
}