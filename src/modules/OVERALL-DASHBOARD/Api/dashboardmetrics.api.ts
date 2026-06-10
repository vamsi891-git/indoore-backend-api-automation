import {
    APIRequestContext,
    APIResponse
} from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {
    DashboardMetricsResponse
}
    from "../Mapper/dashboardmetrics.mapper";
export interface DashboardMetricsApiResult {
    rawResponse:APIResponse;
    responseBody:DashboardMetricsResponse;
    responseTime:number;
}
export class DashboardMetricsApi {
    constructor(private readonly authenticatedApi:APIRequestContext) { }
    async getDashboardMetrics():Promise<DashboardMetricsApiResult> {
        const start =Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,"/indore/dashboard/metrics");
        const responseTime = Date.now() - start;
        const responseBody =await response.json() as DashboardMetricsResponse;
        return {
            rawResponse:response,
            responseBody,
            responseTime
        };
    }
}