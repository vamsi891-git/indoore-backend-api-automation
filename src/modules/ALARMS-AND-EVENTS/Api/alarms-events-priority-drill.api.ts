import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsPriorityDrillData } from "../Data/alarms-events-priority-drill.data";
import { AlarmsEventsPriorityDrillResponse } from "../Mappper/alarms-events-priority-drill.mapper";

export class AlarmsEventsPriorityDrillApi extends TimedApiClient {
  getDrillDown(
    params: Record<string, string | number>,
  ): Promise<ApiCallResult<AlarmsEventsPriorityDrillResponse>> {
    return this.getJson<AlarmsEventsPriorityDrillResponse>(
      alarmsEventsPriorityDrillData.path,
      { params },
    );
  }
}
