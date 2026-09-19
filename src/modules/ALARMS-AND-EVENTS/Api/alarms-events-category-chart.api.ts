import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsCategoryChartData } from "../Data/alarms-events-category-chart.data";
import { AlarmsEventsCategoryChartResponse } from "../Mappper/alarms-events-category-chart.mapper";

export class AlarmsEventsCategoryChartApi extends TimedApiClient {
  getChart(
    params: Record<string, string | number>,
  ): Promise<ApiCallResult<AlarmsEventsCategoryChartResponse>> {
    return this.getJson<AlarmsEventsCategoryChartResponse>(
      alarmsEventsCategoryChartData.path,
      { params },
    );
  }
}
