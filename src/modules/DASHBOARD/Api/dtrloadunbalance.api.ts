import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrLoadUnbalanceResponse } from "../Mapper/dtrloadunbalance.mapper";

export type DtrLoadUnbalanceApiResult = ApiCallResult<DtrLoadUnbalanceResponse>;

export interface DtrLoadUnbalanceQuery {
    [key: string]: string | number | boolean | undefined;
}

export class DtrLoadUnbalanceApi extends TimedApiClient {
    getDtrLoadUnbalance(
        query: DtrLoadUnbalanceQuery = {},
    ): Promise<DtrLoadUnbalanceApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrLoadUnbalanceResponse>(
            "/indore/dashboard/dtr/load-unbalance",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                ...(Object.keys(params).length > 0 ? { params } : {}),
            },
        );
    }
}
