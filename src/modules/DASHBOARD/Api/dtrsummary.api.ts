import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrSummaryResponse } from "../Mapper/dtrsummary.mapper";

export type DtrSummaryApiResult = ApiCallResult<DtrSummaryResponse>;

export interface DtrSummaryQuery {
    period?: string;
    [key: string]: string | number | boolean | undefined;
}

export class DtrSummaryApi extends TimedApiClient {
    getDtrSummary(query: DtrSummaryQuery = {}): Promise<DtrSummaryApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrSummaryResponse>(
            "/indore/dashboard/dtr/summary",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                ...(Object.keys(params).length > 0 ? { params } : {}),
            },
        );
    }
}
