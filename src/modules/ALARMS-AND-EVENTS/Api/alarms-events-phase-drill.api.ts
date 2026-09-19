import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsPhaseDrillData } from "../Data/alarms-events-phase-drill.data";
import { AlarmsEventsPhaseDrillResponse } from "../Mappper/alarms-events-phase-drill.mapper";

export class AlarmsEventsPhaseDrillApi extends TimedApiClient {
  getDrillDown(
    params: Record<string, string | number>,
  ): Promise<ApiCallResult<AlarmsEventsPhaseDrillResponse>> {
    return this.getJson<AlarmsEventsPhaseDrillResponse>(
      alarmsEventsPhaseDrillData.path,
      { params },
    );
  }
}