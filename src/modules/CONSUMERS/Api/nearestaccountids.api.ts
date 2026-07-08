import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { NearestAccountIdsResponse } from "../Mapper/nearestaccountids.mapper";

export interface NearestAccountIdsQuery {
  accountId: string;
  limit?: number;
  maxDistance?: number;
  organisationLookupId?: number;
}

export type NearestAccountIdsApiResult = ApiCallResult<NearestAccountIdsResponse>;

export class NearestAccountIdsApi extends TimedApiClient {
  getNearestAccountIds(
    query: NearestAccountIdsQuery,
  ): Promise<NearestAccountIdsApiResult> {
    const params: Record<string, string | number> = {
      accountId: query.accountId,
    };
    if (query.limit != null) {
      params.limit = query.limit;
    }
    if (query.maxDistance != null) {
      params.maxDistance = query.maxDistance;
    }
    if (query.organisationLookupId != null) {
      params.organisationLookupId = query.organisationLookupId;
    }
    return this.getJson<NearestAccountIdsResponse>(
      "/indore/consumers/nearest-account-ids",
      { params },
    );
  }
}
