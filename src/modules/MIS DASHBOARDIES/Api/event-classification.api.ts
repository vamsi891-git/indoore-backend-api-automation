import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { EventClassificationResponse } from "../Mapper/event-classification.mapper";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventClassificationApiResult = ApiCallResult<EventClassificationResponse>;

export class EventClassificationApi extends TimedApiClient {
  getEventClassification(
    params: Record<string, string | number | boolean>
  ): Promise<EventClassificationApiResult> {
    return this.getJson<EventClassificationResponse>(
      "/indore/mis-dashboard/event-data/classification",
      { params, timeout: MIS_SLOW_REQUEST_TIMEOUT_MS }
    );
  }
}
