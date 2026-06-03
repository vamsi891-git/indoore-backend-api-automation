import { APIRequestContext,APIResponse } from "@playwright/test";
import { SearchConsumerResponse} from "../Mapper/consumersearch.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface SearchConsumerApiResponse {
    rawResponse:APIResponse;
    responseBody:SearchConsumerResponse;
    responseTime:number;
}
export class SearchConsumerApi {
        constructor(private authenticatedApi:APIRequestContext){}
    async SearchConsumers(page:number=1,limit:number=20):Promise<SearchConsumerApiResponse>{
        const start = Date.now()
        const rawResponse = await getWithAutoRefresh(this.authenticatedApi,`/indore/utils/search/consumers?page=${page}&limit=${limit}`);
        return {
            rawResponse,
            responseBody: await rawResponse.json(),
            responseTime: Date.now() - start
        };
    }
}