import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { DtrEventResponse } from "../Mapper/dtrevent.mapper";

export type DtrEventApiResult = ApiCallResult<DtrEventResponse>;

export interface DtrEventQuery {
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    scope?: "network" | "organisation";
    nodeLookupId?: number;
    organisationLookupId?: number;
    networkLookupId?: number;
    meterSerialContains?: string;
    [key: string]: string | number | boolean | undefined;
}

export class DtrEventApi extends TimedApiClient {
    getDtrEvent(query: DtrEventQuery = {}): Promise<DtrEventApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrEventResponse>("/indore/reports/dtr-event", {
            timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
            ...(Object.keys(params).length > 0 ? { params } : {}),
        });
    }
}
