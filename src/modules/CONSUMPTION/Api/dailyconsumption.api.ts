import { APIRequestContext, APIResponse } from "@playwright/test";
import { DailyConsumptionResponse } from "../Mapper/dailyconsumption.mapper";
import { getConsumptionWithRetry } from "../utils/consumption-request.helper";

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
        const { response, responseTime } = await getConsumptionWithRetry(
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
            responseTime,
        };
    }
}
