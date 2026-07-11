import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { EventDetailResponse } from "../Mapper/eventdetail.mapper";

export type EventDetailApiResult = ApiCallResult<EventDetailResponse>;

export interface EventDetailQuery {
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    organisationLookupId?: number;
    networkLookupId?: number;
    [key: string]: string | number | boolean | undefined;
}

export class EventDetailApi extends TimedApiClient {
    getEventDetail(query: EventDetailQuery = {}): Promise<EventDetailApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<EventDetailResponse>("/indore/reports/event-detail", {
            timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
            ...(Object.keys(params).length > 0 ? { params } : {}),
        });
    }
}
