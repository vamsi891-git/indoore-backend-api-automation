import { APIRequestContext, APIResponse } from "@playwright/test";
import { CommercialSummaryResponse } from "../Mapper/commercial-summary.mapper";
import { getCommercialSummaryWithRetry } from "../utils/commercial-request.helper";

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
        const { response, responseTime } = await getCommercialSummaryWithRetry(
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
            responseTime,
        };
    }
}
