import { APIRequestContext, APIResponse} from "@playwright/test";
import { DtrDailyThresholdChartResponse} from "../Mapper/dtrdailythresholdchart.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DtrDailyThresholdChartApiResult {
    rawResponse: APIResponse;
    responseBody: DtrDailyThresholdChartResponse;
    responseTime: number;
}
export class DtrDailyThresholdChartApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getDailyThresholdChart(dtrCode: string): Promise<DtrDailyThresholdChartApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/dtr/${dtrCode}/daily-threshold-chart`);
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}