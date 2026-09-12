import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { EventRestorationResponse } from "../Mapper/eventrestoration.mapper";

export type EventRestorationApiResult = ApiCallResult<EventRestorationResponse>;

export interface EventRestorationQuery {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  organisationLookupId?: number;
  networkLookupId?: number;
  [key: string]: string | number | boolean | undefined;
}

export class EventRestorationApi extends TimedApiClient {
  getEventRestoration(
    query: EventRestorationQuery = {},
  ): Promise<EventRestorationApiResult> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params[key] = value;
      }
    }

    return this.getJson<EventRestorationResponse>(
      "/indore/reports/event-restoration",
      {
        timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
        ...(Object.keys(params).length > 0 ? { params } : {}),
      },
    );
  }
}
