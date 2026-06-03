import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { TechnicalSummaryResponse } from "../Mapper/technical-summary.mapper";
export interface TechnicalSummaryApiResult {
    rawResponse: APIResponse;
    responseBody: TechnicalSummaryResponse;
    responseTime: number;
}
export class TechnicalSummaryApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getTechnicalSummary(month: number,year: number): Promise<TechnicalSummaryApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/analysis/technical/summary?month=${month}&year=${year}`);
        return {
            rawResponse: response,
            responseBody:await response.json(),
            responseTime:Date.now() - start
        };
    }
}