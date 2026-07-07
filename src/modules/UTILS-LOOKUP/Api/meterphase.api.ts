// Api/meterphase.api.ts
import {APIRequestContext,APIResponse} from "@playwright/test";

import { MeterPhaseResponse}from "../Mapper/meterphase.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { parseLookupJsonResponse } from "../utils/lookup-api-parse.helper";
export interface MeterPhaseApiResponse {
    rawResponse: APIResponse;
    responseBody: MeterPhaseResponse;
    responseTime: number;
}
export class MeterPhaseApi {
    constructor(
        private authenticatedApi: APIRequestContext
    ) { }
    async getMeterPhases():
        Promise<MeterPhaseApiResponse> {
        const start = Date.now();
        const rawResponse =
            await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/meter-phases");
        return {
            rawResponse,
            responseBody: await parseLookupJsonResponse<MeterPhaseResponse>(
                rawResponse,
                "meter-phases",
            ),
            responseTime: Date.now() - start
        };
    }

}