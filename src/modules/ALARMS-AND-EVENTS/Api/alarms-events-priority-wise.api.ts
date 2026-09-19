import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { alarmsEventsPriorityWiseData } from "../Data/alarms-events-priority-wise.data";
import { AlarmsEventsPriorityWiseResponse } from "../Mappper/alarms-events-priority-wise.mapper";

export class AlarmsEventsPriorityWiseApi extends TimedApiClient {
  getPriorityWise(
    params?: Record<string, string | number>,
  ): Promise<ApiCallResult<AlarmsEventsPriorityWiseResponse>> {
    return this.getJson<AlarmsEventsPriorityWiseResponse>(
      alarmsEventsPriorityWiseData.path,
      params ? { params } : {},
    );
  }
}
