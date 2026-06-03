import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh} from "../../../core/utils/authenticated.request";
import { MonthlyNetMeterResponse} from "../Mapper/monthlynetmeter.mapper"
export interface MonthlyNetMeterApiResult {
    rawResponse: APIResponse;
    responseBody: MonthlyNetMeterResponse;
    responseTime: number;
}
export class MonthlyNetMeterApi {
    constructor(private authenticatedApi: APIRequestContext) { }
    async getMonthlyNetMeter(
        page: number,
        limit: number,
        month: number,
        year: number
    ): Promise<MonthlyNetMeterApiResult> {

        const start = Date.now();
        const response =
            await getWithAutoRefresh(
                this.authenticatedApi,
                `/indore/consumption/monthly-net-meter?page=${page}&limit=${limit}&month=${month}&year=${year}`
            );
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}