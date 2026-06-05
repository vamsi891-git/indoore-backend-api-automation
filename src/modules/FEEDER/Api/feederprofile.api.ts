import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { FeederProfileResponse } from "../Mapper/feederprofile.mapper";
export interface FeederProfileApiResult {
    rawResponse: APIResponse;
    responseBody: FeederProfileResponse;
    responseTime: number;
}
export class FeederProfileApi {
    constructor(private readonly authenticatedApi: APIRequestContext) {}
    async getFeederProfile(feederCode: string): Promise<FeederProfileApiResult> {
        const start = Date.now();
        const response = await getWithAutoRefresh(
            this.authenticatedApi,
            `/indore/feeder/${feederCode}/profile`
        );
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}