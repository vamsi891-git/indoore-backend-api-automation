import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrConsumptionResponse } from "../Mapper/dtrconsumption.mapper";

export type DtrConsumptionApiResult = ApiCallResult<DtrConsumptionResponse>;

export interface DtrConsumptionQuery {
    period?: string;
    [key: string]: string | number | boolean | undefined;
}

export class DtrConsumptionApi extends TimedApiClient {
    getDtrConsumption(
        query: DtrConsumptionQuery = {},
    ): Promise<DtrConsumptionApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrConsumptionResponse>(
            "/indore/dashboard/dtr/consumption",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                ...(Object.keys(params).length > 0 ? { params } : {}),
            },
        );
    }
}
