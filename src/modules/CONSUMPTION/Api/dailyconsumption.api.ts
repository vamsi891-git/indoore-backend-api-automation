import { APIRequestContext, APIResponse } from "@playwright/test";
import { DailyConsumptionResponse } from "../Mapper/dailyconsumption.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface DailyConsumptionApiResult {
    rawResponse: APIResponse;
    responseBody: DailyConsumptionResponse;
    responseTime: number;
}

export class DailyConsumptionApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}

    async getDailyReport(
        page: number,
        limit: number,
        fromDate: string,
        toDate: string,
        month: number,
        year: number,
    ): Promise<DailyConsumptionApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(
            this.authenticatedApi,
            "/indore/consumption/report",
            {
                params: {
                    reportType: "daily",
                    page,
                    limit,
                    fromDate,
                    toDate,
                    month,
                    year,
                },
            },
        );
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start,
        };
    }
}
