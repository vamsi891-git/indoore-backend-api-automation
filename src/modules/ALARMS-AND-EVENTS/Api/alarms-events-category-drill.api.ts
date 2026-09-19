import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsCategoryDrillData } from "../Data/alarms-events-category-drill.data";
import { AlarmsEventsCategoryDrillResponse } from "../Mappper/alarms-events-category-drill.mapper";

export class AlarmsEventsCategoryDrillApi extends TimedApiClient {
  getDrillDown(
    params: Record<string, string | number>,
  ): Promise<ApiCallResult<AlarmsEventsCategoryDrillResponse>> {
    return this.getJson<AlarmsEventsCategoryDrillResponse>(
      alarmsEventsCategoryDrillData.path,
      { params },
    );
  }
}
