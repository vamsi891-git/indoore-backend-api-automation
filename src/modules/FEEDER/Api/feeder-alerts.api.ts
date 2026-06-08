import { APIRequestContext, APIResponse } from "@playwright/test";
import { FeederAlertsResponse } from "../Mapper/feeder-alerts.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface FeederAlertsApiResult {
    rawResponse: APIResponse;
    responseBody: FeederAlertsResponse;
    responseTime: number;
}

export class FeederAlertsApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}

    async getAlerts(
        feederCode: string,
        page: number,
        limit: number,
    ): Promise<FeederAlertsApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(
            this.authenticatedApi,
            `/indore/feeder/${feederCode}/alerts`,
            {
                params: {
                    page,
                    limit,
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
