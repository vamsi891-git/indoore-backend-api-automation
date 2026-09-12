import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { ReportsOverviewResponse } from "../Mapper/overview.mapper";

export type ReportsOverviewApiResult = ApiCallResult<ReportsOverviewResponse>;

export interface ReportsOverviewQuery {
  [key: string]: string | number | boolean | undefined;
}

export class ReportsOverviewApi extends TimedApiClient {
  getOverview(
    query: ReportsOverviewQuery = {},
  ): Promise<ReportsOverviewApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<ReportsOverviewResponse>("/indore/reports/overview", {
      timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
      ...(Object.keys(params).length > 0 ? { params } : {}),
    });
  }
}
