import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { EventLogCardsResponse } from "../Mapper/eventlogcards.mapper";

export type EventLogCardsApiResult = ApiCallResult<EventLogCardsResponse>;

export interface EventLogCardsQuery {
  [key: string]: string | number | boolean | undefined;
}

export class EventLogCardsApi extends TimedApiClient {
  getEventLogCards(
    consumerRef: string,
    query: EventLogCardsQuery = {},
  ): Promise<EventLogCardsApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<EventLogCardsResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/event-log/cards`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
