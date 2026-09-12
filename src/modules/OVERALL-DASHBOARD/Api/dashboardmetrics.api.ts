import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DashboardMetricsResponse } from "../Mapper/dashboardmetrics.mapper";

export type DashboardMetricsApiResult = ApiCallResult<DashboardMetricsResponse>;

export const OVERALL_METRICS_PATH = "/indore/dashboard/overall-metrics";

export class DashboardMetricsApi extends TimedApiClient {
  getDashboardMetrics(): Promise<DashboardMetricsApiResult> {
    return this.getJson<DashboardMetricsResponse>(OVERALL_METRICS_PATH, {
      timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
    });
  }
}
