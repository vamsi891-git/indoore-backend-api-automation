import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { MASTER_DATA_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
    DtrDailyThresholdChartResponse,
    type DtrDailyThresholdPeriod,
} from "../Mapper/dtrdailythresholdchart.mapper";

export type DtrDailyThresholdChartApiResult =
    ApiCallResult<DtrDailyThresholdChartResponse>;

export interface DtrDailyThresholdChartQuery {
    period: DtrDailyThresholdPeriod;
    [key: string]: string | number | boolean | undefined;
}

export class DtrDailyThresholdChartApi extends TimedApiClient {
    getDailyThresholdChart(
        dtrCode: string,
        query: DtrDailyThresholdChartQuery,
    ): Promise<DtrDailyThresholdChartApiResult> {
        const params: Record<string, string | number | boolean> = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params[key] = value;
            }
        }

        return this.getJson<DtrDailyThresholdChartResponse>(
            `/indore/dtr/${encodeURIComponent(dtrCode)}/daily-threshold-chart`,
            {
                timeout: MASTER_DATA_REQUEST_TIMEOUT_MS,
                params,
            },
        );
    }
}
