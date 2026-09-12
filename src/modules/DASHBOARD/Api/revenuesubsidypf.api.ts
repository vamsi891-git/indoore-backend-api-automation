import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { RevenueSubsidyPfSaveRequest } from "../Data/revenuesubsidypf.data";
import { RevenueSubsidyPfResponse } from "../Mapper/revenuesubsidypf.mapper";

export type RevenueSubsidyPfApiResult = ApiCallResult<RevenueSubsidyPfResponse>;

export interface RevenueSubsidyPfQuery {
  [key: string]: string | number | boolean | undefined;
}

export class RevenueSubsidyPfApi extends TimedApiClient {
  getRevenueSubsidyPf(
    query: RevenueSubsidyPfQuery = {},
  ): Promise<RevenueSubsidyPfApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<RevenueSubsidyPfResponse>(
      "/indore/dashboard/revenue-subsidy-pf",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }

  /** POST save is off. Do not set ALLOW_WRITE_TESTS=true on production. */
  saveRevenueSubsidyPf(
    payload: RevenueSubsidyPfSaveRequest,
  ): Promise<RevenueSubsidyPfApiResult> {
    if (process.env.ALLOW_WRITE_TESTS?.trim().toLowerCase() !== "true") {
      throw new Error(
        "Blocked POST /indore/dashboard/revenue-subsidy-pf. Dashboard writes are off.",
      );
    }
    return this.postJson<RevenueSubsidyPfResponse>(
      "/indore/dashboard/revenue-subsidy-pf",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        data: payload,
      },
    );
  }
}
