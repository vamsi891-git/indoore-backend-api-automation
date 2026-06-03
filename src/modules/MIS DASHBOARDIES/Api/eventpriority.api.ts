import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResultWithTimeout } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type EventPriorityApiResult = ApiCallResultWithTimeout;

export class EventPriorityApi extends TimedApiClient {
  async getPriorityData(
    priority: string,
    params: Record<string, string>
  ): Promise<EventPriorityApiResult> {
    const start = Date.now();
    try {
      const result = await this.getJson(
        `/indore/mis-dashboard/event-data/priority-wise/${priority}`,
        { params, timeout: MIS_SLOW_REQUEST_TIMEOUT_MS }
      );
      return { ...result, timeout: false };
    } catch {
      return {
        responseTime: Date.now() - start,
        timeout: true
      } as EventPriorityApiResult;
    }
  }
}
