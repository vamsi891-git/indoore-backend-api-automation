import { APIRequestContext, APIResponse } from "@playwright/test";
import { DtrEventsResponse } from "../Mapper/dtrevents.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface DtrEventsApiResult {
    rawResponse: APIResponse;
    responseBody: DtrEventsResponse;
    responseTime: number;
}

export class DtrEventsApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}

    async getEvents(
        dtrCode: string,
        page: number,
        limit: number,
    ): Promise<DtrEventsApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(
            this.authenticatedApi,
            `/indore/dtr/${dtrCode}/events`,
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
