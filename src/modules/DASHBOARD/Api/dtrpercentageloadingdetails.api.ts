import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
    DtrPercentageLoadingDetailsResponse,
    type DtrPercentageLoadingDetailsBand,
} from "../Mapper/dtrpercentageloadingdetails.mapper";

export type DtrPercentageLoadingDetailsApiResult =
    ApiCallResult<DtrPercentageLoadingDetailsResponse>;

export type { DtrPercentageLoadingDetailsBand };

export interface DtrPercentageLoadingDetailsQuery {
    band: DtrPercentageLoadingDetailsBand;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | undefined;
}

export class DtrPercentageLoadingDetailsApi extends TimedApiClient {
    getDtrPercentageLoadingDetails(
        query: DtrPercentageLoadingDetailsQuery,
    ): Promise<DtrPercentageLoadingDetailsApiResult> {
        const params: Record<string, string | number | boolean> = {
            band: query.band,
            page: query.page ?? 1,
            limit: query.limit ?? 10,
        };
        for (const [key, value] of Object.entries(query)) {
            if (
                value !== undefined &&
                key !== "band" &&
                key !== "page" &&
                key !== "limit"
            ) {
                params[key] = value as string | number | boolean;
            }
        }

        return this.getJson<DtrPercentageLoadingDetailsResponse>(
            "/indore/dashboard/dtr/percentage-loading-details",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                params,
            },
        );
    }
}
