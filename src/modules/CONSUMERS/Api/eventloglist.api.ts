import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { EventLogListResponse } from "../Mapper/eventloglist.mapper";

export type EventLogListApiResult = ApiCallResult<EventLogListResponse>;

export interface EventLogListQuery {
  eventPage?: number;
  eventPageSize?: number;
  eventSearch?: string;
  [key: string]: string | number | boolean | undefined;
}

export class EventLogListApi extends TimedApiClient {
  getEventLogList(
    consumerRef: string,
    query: EventLogListQuery = {},
  ): Promise<EventLogListApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<EventLogListResponse>(
      `/indore/consumers/${encodeURIComponent(consumerRef)}/event-log/list`,
      Object.keys(params).length > 0 ? { params } : {},
    );
  }
}
