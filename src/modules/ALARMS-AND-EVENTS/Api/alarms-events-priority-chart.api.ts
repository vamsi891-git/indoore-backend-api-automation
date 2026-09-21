import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsPriorityChartData } from "../Data/alarms-events-priority-chart.data";
import { AlarmsEventsPriorityChartResponse } from "../Mapper/alarms-events-priority-chart.mapper";

export class AlarmsEventsPriorityChartApi extends TimedApiClient {
  getChart(
    params: Record<string, string | number>,
  ): Promise<ApiCallResult<AlarmsEventsPriorityChartResponse>> {
    return this.getJson<AlarmsEventsPriorityChartResponse>(alarmsEventsPriorityChartData.path, {
      params,
    });
  }
}
