import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrCommunicationResponse } from "../Mapper/dtrcommunication.mapper";

export type DtrCommunicationApiResult = ApiCallResult<DtrCommunicationResponse>;

export interface DtrCommunicationQuery {
    period?: string;
    [key: string]: string | number | boolean | undefined;
}

export class DtrCommunicationApi extends TimedApiClient {
    getDtrCommunicationStatus(
        query: DtrCommunicationQuery = {},
    ): Promise<DtrCommunicationApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrCommunicationResponse>(
            "/indore/dashboard/dtr/communication-status",
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                ...(Object.keys(params).length > 0 ? { params } : {}),
            },
        );
    }
}
