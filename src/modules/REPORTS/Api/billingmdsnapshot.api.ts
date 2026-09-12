import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { BillingMdSnapshotResponse } from "../Mapper/billingmdsnapshot.mapper";

export type BillingMdSnapshotApiResult =
  ApiCallResult<BillingMdSnapshotResponse>;

export interface BillingMdSnapshotQuery {
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  organisationLookupId?: number;
  networkLookupId?: number;
  meterSerialNumber?: string;
  ivrsNumber?: string;
  [key: string]: string | number | boolean | undefined;
}

export class BillingMdSnapshotApi extends TimedApiClient {
  getBillingMdSnapshot(
    query: BillingMdSnapshotQuery = {},
  ): Promise<BillingMdSnapshotApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<BillingMdSnapshotResponse>(
      "/indore/reports/billing-md-snapshot",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
