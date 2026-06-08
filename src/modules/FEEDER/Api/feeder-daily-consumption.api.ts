import { APIRequestContext, APIResponse } from "@playwright/test";
import { FeederDailyConsumptionResponse } from "../Mapper/feeder-daily-consumption.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface FeederDailyConsumptionApiResult {
    rawResponse: APIResponse;
    responseBody: FeederDailyConsumptionResponse;
    responseTime: number;
}

export class FeederDailyConsumptionApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}

    async getDailyConsumption(
        feederCode: string,
        granularity: "day" | "monthly",
    ): Promise<FeederDailyConsumptionApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(
            this.authenticatedApi,
            `/indore/feeder/${feederCode}/daily-consumption`,
            {
                params: { granularity },
            },
        );
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start,
        };
    }
}
