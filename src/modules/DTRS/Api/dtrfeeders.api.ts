import { APIRequestContext, APIResponse} from "@playwright/test";
import { DtrFeedersResponse  } from "../Mapper/dtrfeeders.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DtrFeedersApiResult {
    rawResponse: APIResponse;
    responseBody: DtrFeedersResponse;
    responseTime: number;
}
export class DtrFeedersApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getFeeders(dtrCode: string): Promise<DtrFeedersApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/dtr/${dtrCode}/feeders`);
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}