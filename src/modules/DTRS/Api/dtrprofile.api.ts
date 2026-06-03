import { APIRequestContext, APIResponse } from "@playwright/test";
import { DtrProfileResponse } from "../Mapper/dtrprofile.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DtrProfileApiResult {
    rawResponse: APIResponse;
    responseBody: DtrProfileResponse;
    responseTime: number;
}
export class DtrProfileApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getProfile(dtrCode: string): Promise<DtrProfileApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/dtr/${dtrCode}/profile`);
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}