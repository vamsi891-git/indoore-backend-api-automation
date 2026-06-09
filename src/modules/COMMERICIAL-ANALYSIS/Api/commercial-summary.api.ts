import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { CommercialSummaryResponse } from "../Mapper/commercial-summary.mapper";

export interface CommercialSummaryApiResult {
    rawResponse: APIResponse;
    responseBody: CommercialSummaryResponse;
    responseTime: number;
}

export class CommercialSummaryApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}

    async getCommercialSummary(
        month: number,
        year: number,
        pfThreshold: number,
    ): Promise<CommercialSummaryApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(
            this.authenticatedApi,
            "/indore/analysis/commercial/summary",
            {
                params: {
                    month,
                    year,
                    pfThreshold,
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
