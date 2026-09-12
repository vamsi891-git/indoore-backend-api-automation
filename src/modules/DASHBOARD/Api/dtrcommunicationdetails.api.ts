import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
    DtrCommunicationDetailsResponse,
    type DtrCommunicationDetailsStatus,
} from "../Mapper/dtrcommunicationdetails.mapper";

export type DtrCommunicationDetailsApiResult =
    ApiCallResult<DtrCommunicationDetailsResponse>;

export type { DtrCommunicationDetailsStatus };

export interface DtrCommunicationDetailsQuery {
    status: DtrCommunicationDetailsStatus;
    page?: number;
    limit?: number;
    [key: string]: string | number | boolean | undefined;
}

export class DtrCommunicationDetailsApi extends TimedApiClient {
    getDtrCommunicationDetails(
        query: DtrCommunicationDetailsQuery,
    ): Promise<DtrCommunicationDetailsApiResult> {
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

        return this.getJson<DtrCommunicationDetailsResponse>(
            "/indore/dashboard/dtr/communication-details",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                params,
            },
        );
    }
}
