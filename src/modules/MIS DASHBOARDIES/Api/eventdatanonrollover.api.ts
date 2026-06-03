import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResultWithTimeout } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventNonRolloverApiResult = ApiCallResultWithTimeout;

export class EventNonRolloverApi extends TimedApiClient {
  async getNonRolloverData(params: Record<string, string>): Promise<EventNonRolloverApiResult> {
    const start = Date.now();
    try {
      const result = await this.getJson(
        "/indore/mis-dashboard/event-data/non-rollover-control",
        { params, timeout: MIS_SLOW_REQUEST_TIMEOUT_MS }
      );
      return { ...result, timeout: false };
    } catch {
      return {
        responseTime: Date.now() - start,
        timeout: true
      } as EventNonRolloverApiResult;
    }
  }
}
