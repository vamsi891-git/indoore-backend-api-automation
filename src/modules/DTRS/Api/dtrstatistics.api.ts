import { APIRequestContext, APIResponse} from "@playwright/test";
import { DtrStatisticsResponse} from "../Mapper/dtrstatistics.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DtrStatisticsApiResult {
    rawResponse: APIResponse;
    responseBody: DtrStatisticsResponse;
    responseTime: number;
}
export class DtrStatisticsApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getDtrStatistics(dtrCode: string): Promise<DtrStatisticsApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(this.authenticatedApi,`/indore/dtr/${dtrCode}/statistics`);
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}