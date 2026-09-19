import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsCategoryWiseData } from "../Data/alarms-events-category-wise.data";
import { AlarmsEventsCategoryWiseResponse } from "../Mappper/alarms-events-category-wise.mapper";

export class AlarmsEventsCategoryWiseApi extends TimedApiClient {
  getCategoryWise(
    params?: Record<string, string | number>,
  ): Promise<ApiCallResult<AlarmsEventsCategoryWiseResponse>> {
    return this.getJson<AlarmsEventsCategoryWiseResponse>(
      alarmsEventsCategoryWiseData.path,
      params ? { params } : {},
    );
  }
}
