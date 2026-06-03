import { APIRequestContext,  APIResponse } from "@playwright/test";
import { DashboardMetricsResponse } from "../Mapper/dashboardmetrics.mapper";
export interface DashboardMetricsApiResponse {
    rawResponse: APIResponse;
    responseBody: DashboardMetricsResponse;
    responseTime: number;
}
export class DashboardMetricsApi {
    constructor(private request: APIRequestContext) { }
    async getDashboardMetrics():
        Promise<DashboardMetricsApiResponse> {
        const start = Date.now();
        const rawResponse =await this.request.get("/indore/dashboard/metrics");
        const responseBody =await rawResponse.json();
        const responseTime = Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };
    }
}