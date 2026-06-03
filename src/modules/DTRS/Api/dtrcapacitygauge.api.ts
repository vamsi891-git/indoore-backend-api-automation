import { APIRequestContext, APIResponse} from "@playwright/test";
import {DtrCapacityGaugeResponse} from "../Mapper/dtrcapacitygauge.mapper";
import {getWithAutoRefresh} from "../../../core/utils/authenticated.request";
export interface DtrCapacityGaugeApiResult {
    rawResponse: APIResponse;
    responseBody: DtrCapacityGaugeResponse;
    responseTime: number;
}
export class DtrCapacityGaugeApi {
    constructor(private readonly authenticatedApi:APIRequestContext) {}
    async getCapacityGauge(dtrCode: string): Promise<DtrCapacityGaugeApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/dtr/${dtrCode}/capacity-gauge`);
        return {
            rawResponse: response,
            responseBody:await response.json(),
            responseTime:Date.now() - start
        };
    }
}