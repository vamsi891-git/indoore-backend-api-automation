import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";

export class EventDetailApi extends TimedApiClient {
    getEventDetail(
        fromDate: string,
        toDate: string,
        organisationLookupId: number,
        limit: number,
    ): Promise<ApiCallResult> {
        return this.getJson("/indore/reports/event-detail", {
            params: {
                fromDate,
                toDate,
                organisationLookupId,
                limit,
            },
        });
    }
}
