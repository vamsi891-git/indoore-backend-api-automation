import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

export type CommunicationCategoryApiResult = ApiCallResult;

export class CommunicationCategoryApi extends TimedApiClient {
  getCategories(
    params: Record<string, string | number | boolean>,
  ): Promise<CommunicationCategoryApiResult> {
    return this.getJson("/indore/mis-dashboard/communication-category", {
      params,
      timeout: MIS_SLOW_REQUEST_TIMEOUT_MS,
    });
  }
}
