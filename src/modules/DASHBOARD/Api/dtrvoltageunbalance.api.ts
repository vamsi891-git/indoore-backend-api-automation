import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrVoltageUnbalanceResponse } from "../Mapper/dtrvoltageunbalance.mapper";

export type DtrVoltageUnbalanceApiResult =
    ApiCallResult<DtrVoltageUnbalanceResponse>;

export interface DtrVoltageUnbalanceQuery {
    [key: string]: string | number | boolean | undefined;
}

export class DtrVoltageUnbalanceApi extends TimedApiClient {
    getDtrVoltageUnbalance(
        query: DtrVoltageUnbalanceQuery = {},
    ): Promise<DtrVoltageUnbalanceApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrVoltageUnbalanceResponse>(
            "/indore/dashboard/dtr/voltage-unbalance",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                ...(Object.keys(params).length > 0 ? { params } : {}),
            },
        );
    }
}
