import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { ConsumerProfileResponse } from "../Mapper/consumerprofile.mapper";

export interface ConsumerProfileQuery {
  billingLimit?: number;
  eventPage?: number;
  eventPageSize?: number;
}

export type ConsumerProfileApiResult = ApiCallResult<ConsumerProfileResponse>;

export class ConsumerProfileApi extends TimedApiClient {
  getConsumerProfile(
    consumerRef: string,
    query: ConsumerProfileQuery = {},
  ): Promise<ConsumerProfileApiResult> {
    const params: Record<string, string | number> = {};
    if (query.billingLimit != null) {
      params.billingLimit = query.billingLimit;
    }
    if (query.eventPage != null) {
      params.eventPage = query.eventPage;
    }
    if (query.eventPageSize != null) {
      params.eventPageSize = query.eventPageSize;
    }

    return this.getJson<ConsumerProfileResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/profile`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
