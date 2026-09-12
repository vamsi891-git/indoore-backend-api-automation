import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
    DtrVoltageUnbalanceDetailsResponse,
    type DtrVoltageUnbalanceSeverity,
} from "../Mapper/dtrvoltageunbalancedetails.mapper";

export type DtrVoltageUnbalanceDetailsApiResult =
    ApiCallResult<DtrVoltageUnbalanceDetailsResponse>;

export type { DtrVoltageUnbalanceSeverity };

export interface DtrVoltageUnbalanceDetailsQuery {
    severity: DtrVoltageUnbalanceSeverity;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | undefined;
}

export class DtrVoltageUnbalanceDetailsApi extends TimedApiClient {
    getDtrVoltageUnbalanceDetails(
        query: DtrVoltageUnbalanceDetailsQuery,
    ): Promise<DtrVoltageUnbalanceDetailsApiResult> {
        const params: Record<string, string | number | boolean> = {
            severity: query.severity,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
        };
        for (const [key, value] of Object.entries(query)) {
            if (
                value !== undefined &&
                key !== "severity" &&
                key !== "page" &&
                key !== "limit"
            ) {
                params[key] = value as string | number | boolean;
            }
        }

        return this.getJson<DtrVoltageUnbalanceDetailsResponse>(
            "/indore/dashboard/dtr/voltage-unbalance-details",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                params,
            },
        );
    }
}
