import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsDashboardData } from "../Data/alarms-events-dashboard.data";
import { AlarmsEventsDashboardResponse } from "../Mapper/alarms-events-dashboard.mapper";
export type AlarmsEventsDashboardApiResult = ApiCallResult<AlarmsEventsDashboardResponse>;
export class AlarmsEventsDasboardApi extends TimedApiClient {
  getDashboard(): Promise<AlarmsEventsDashboardApiResult> {
    return this.getJson<AlarmsEventsDashboardResponse>(alarmsEventsDashboardData.path);
  }
}
