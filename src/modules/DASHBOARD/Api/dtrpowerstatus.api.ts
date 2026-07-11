import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrPowerStatusResponse } from "../Mapper/dtrpowerstatus.mapper";

export type DtrPowerStatusApiResult = ApiCallResult<DtrPowerStatusResponse>;

export interface DtrPowerStatusQuery {
    period?: string;
    [key: string]: string | number | boolean | undefined;
}

export class DtrPowerStatusApi extends TimedApiClient {
    getDtrPowerStatus(
        query: DtrPowerStatusQuery = {},
    ): Promise<DtrPowerStatusApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrPowerStatusResponse>(
            "/indore/dashboard/dtr/power-status",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                ...(Object.keys(params).length > 0 ? { params } : {}),
            },
        );
    }
}
