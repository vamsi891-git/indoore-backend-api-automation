import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
    DtrPowerStatusDetailsResponse,
    type DtrPowerStatusDetailsStatus,
} from "../Mapper/dtrpowerstatusdetails.mapper";

export type DtrPowerStatusDetailsApiResult =
    ApiCallResult<DtrPowerStatusDetailsResponse>;

export type { DtrPowerStatusDetailsStatus };

export interface DtrPowerStatusDetailsQuery {
    status: DtrPowerStatusDetailsStatus;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | undefined;
}

export class DtrPowerStatusDetailsApi extends TimedApiClient {
    getDtrPowerStatusDetails(
        query: DtrPowerStatusDetailsQuery,
    ): Promise<DtrPowerStatusDetailsApiResult> {
        const params: Record<string, string | number | boolean> = {
            status: query.status,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
        };
        for (const [key, value] of Object.entries(query)) {
            if (
                value !== undefined &&
                key !== "status" &&
                key !== "page" &&
                key !== "limit"
            ) {
                params[key] = value as string | number | boolean;
            }
        }

        return this.getJson<DtrPowerStatusDetailsResponse>(
            "/indore/dashboard/dtr/power-status-details",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                params,
            },
        );
    }
}
