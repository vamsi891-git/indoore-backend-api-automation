import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DashboardMetricsResponse } from "../Mapper/dashboardmetrics.mapper";

export type DashboardMetricsApiResult = ApiCallResult<DashboardMetricsResponse>;

export interface DashboardMetricsQuery {
    [key: string]: string | number | boolean | undefined;
}

export class DashboardMetricsApi extends TimedApiClient {
    getDashboardMetrics(
        query: DashboardMetricsQuery = {},
    ): Promise<DashboardMetricsApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DashboardMetricsResponse>("/indore/dashboard/metrics", {
            timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
            ...(Object.keys(params).length > 0 ? { params } : {}),
        });
    }
}
