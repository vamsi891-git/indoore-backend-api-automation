import {
    APIRequestContext,
    APIResponse
}
    from "@playwright/test";

import {
    DtrSummaryResponse
}
    from "../Mapper/dtrsummary.mapper";

export interface DtrSummaryApiResponse {

    rawResponse: APIResponse;

    responseBody:
    DtrSummaryResponse;

    responseTime: number;

}

export class DtrSummaryApi {

    constructor(
        private request:
            APIRequestContext
    ) { }

    async getDtrSummary(
        page: number,
        limit: number,
    ): Promise<DtrSummaryApiResponse> {

        const start =
            Date.now();

        const rawResponse =
            await this.request.get(
                `/indore/dashboard/dtr/summary?page=${page}&limit=${limit}`,
            );

        const responseBody =
            await rawResponse.json();

        const responseTime =
            Date.now() - start;

        return {

            rawResponse,
            responseBody,
            responseTime

        };

    }

}