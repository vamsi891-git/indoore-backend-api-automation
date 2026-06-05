import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";

export class EventReportApi extends TimedApiClient {
    getEventReport(
        fromDate: string,
        toDate: string,
        organisationLookupId: number,
        limit: number,
    ): Promise<ApiCallResult> {
        return this.getJson("/indore/reports/event-report", {
            params: {
                fromDate,
                toDate,
                organisationLookupId,
                limit,
            },
        });
    }
}
