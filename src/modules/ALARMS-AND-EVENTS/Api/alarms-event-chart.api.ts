import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { AlarmsEventsChartResponse } from "../Mapper/alarms-events-chart.mapper";
import { alarmsEventsChartData } from "../Data/alarms-events-chart.data";

export type AlarmsEventsChartApiResult = ApiCallResult<AlarmsEventsChartResponse>;

export class AlarmsEventsChartApi extends TimedApiClient {
  getChart(params: Record<string, string | number>): Promise<AlarmsEventsChartApiResult> {
    return this.getJson<AlarmsEventsChartResponse>(alarmsEventsChartData.path, { params });
  }
}
