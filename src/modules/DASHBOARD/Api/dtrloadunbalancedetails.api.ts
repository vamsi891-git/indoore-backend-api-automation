import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrLoadUnbalanceDetailsResponse } from "../Mapper/dtrloadunbalancedetails.mapper";

export type DtrLoadUnbalanceDetailsApiResult =
    ApiCallResult<DtrLoadUnbalanceDetailsResponse>;

export type DtrLoadUnbalanceSeverity = "severe" | "moderate" | "balanced";

export interface DtrLoadUnbalanceDetailsQuery {
    severity: DtrLoadUnbalanceSeverity;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | undefined;
}

export class DtrLoadUnbalanceDetailsApi extends TimedApiClient {
    getDtrLoadUnbalanceDetails(
        query: DtrLoadUnbalanceDetailsQuery,
    ): Promise<DtrLoadUnbalanceDetailsApiResult> {
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

        return this.getJson<DtrLoadUnbalanceDetailsResponse>(
            "/indore/dashboard/dtr/load-unbalance-details",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                params,
            },
        );
    }
}
