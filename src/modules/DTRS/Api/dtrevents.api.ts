import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrEventsResponse } from "../Mapper/dtrevents.mapper";

export type DtrEventsApiResult = ApiCallResult<DtrEventsResponse>;

export interface DtrEventsQuery {
    page?: number;
    limit?: number;
    q?: string;
    [key: string]: string | number | boolean | undefined;
}

export class DtrEventsApi extends TimedApiClient {
    getEvents(
        dtrCode: string,
        query: DtrEventsQuery = {},
    ): Promise<DtrEventsApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrEventsResponse>(
            `/indore/dtr/${encodeURIComponent(dtrCode)}/events`,
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                ...(Object.keys(params).length > 0 ? { params } : {}),
            },
        );
    }
}
