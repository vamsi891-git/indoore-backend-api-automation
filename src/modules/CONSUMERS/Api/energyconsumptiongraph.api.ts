import { APIRequestContext, APIResponse } from "@playwright/test";
import { EnergyConsumptionGraphResponse } from "../Mapper/energyconsumptiongraph.mapper";
import { getConsumerWithRetry } from "../utils/consumer-request.helper";
export interface EnergyConsumptionGraphApiResult {
    rawResponse: APIResponse;
    responseBody:EnergyConsumptionGraphResponse;
    responseTime: number;
}
export class EnergyConsumptionGraphApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getEnergyConsumptionGraph(consumerNumber: string): Promise<EnergyConsumptionGraphApiResult> {
        const { rawResponse, responseTime } = await getConsumerWithRetry(
            this.authenticatedApi,
            `/indore/consumers/${consumerNumber}/energy-consumption-graph`,
        );
        return {
            rawResponse,
            responseBody: await rawResponse.json(),
            responseTime,
        };
    }
}