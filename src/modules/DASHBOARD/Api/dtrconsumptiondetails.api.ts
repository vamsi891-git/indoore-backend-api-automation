import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
    DtrConsumptionDetailsResponse,
    type DtrConsumptionDetailsKind,
} from "../Mapper/dtrconsumptiondetails.mapper";

export type DtrConsumptionDetailsApiResult =
    ApiCallResult<DtrConsumptionDetailsResponse>;

export type { DtrConsumptionDetailsKind };

export interface DtrConsumptionDetailsQuery {
    kind: DtrConsumptionDetailsKind;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | undefined;
}

export class DtrConsumptionDetailsApi extends TimedApiClient {
    getDtrConsumptionDetails(
        query: DtrConsumptionDetailsQuery,
    ): Promise<DtrConsumptionDetailsApiResult> {
        const params: Record<string, string | number | boolean> = {
            kind: query.kind,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
        };
        for (const [key, value] of Object.entries(query)) {
            if (
                value !== undefined &&
                key !== "kind" &&
                key !== "page" &&
                key !== "limit"
            ) {
                params[key] = value as string | number | boolean;
            }
        }

        return this.getJson<DtrConsumptionDetailsResponse>(
            "/indore/dashboard/dtr/consumption-details",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                params,
            },
        );
    }
}
