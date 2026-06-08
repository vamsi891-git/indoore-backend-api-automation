import { APIRequestContext, APIResponse } from "@playwright/test";
import { EventLogListResponse } from "../Mapper/eventloglist.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";

export interface EventLogListApiResult {
    rawResponse: APIResponse;
    responseBody: EventLogListResponse;
    responseTime: number;
}

export class EventLogListApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}

    async getEventLogList(
        consumerNumber: string,
        eventPage: number,
        eventPageSize: number,
    ): Promise<EventLogListApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(
            this.authenticatedApi,
            `/indore/consumers/${consumerNumber}/event-log/list`,
            {
                params: {
                    eventPage,
                    eventPageSize,
                },
            },
        );
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start,
        };
    }
}
