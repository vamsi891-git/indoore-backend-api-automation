    import { APIRequestContext, APIResponse } from "@playwright/test";
    import { ConsumerProfileResponse } from "../Mapper/consumerprofile.mapper";
    import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
    export interface ConsumerProfileApiResult {
        rawResponse:APIResponse;
        responseBody:ConsumerProfileResponse;
        responseTime:number;
    }
    export class ConsumerProfileApi {
        constructor(private readonly authenticatedApi:APIRequestContext) { }
        async getConsumerProfile(consumerNumber: string,params:Record<string,string | number | boolean>):Promise<ConsumerProfileApiResult> {
            const start =Date.now();
            const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/consumers/${consumerNumber}/profile`, {params});
            return {
                rawResponse:response,
                responseBody:await response.json(),
                responseTime:Date.now() - start
            };
        }
    }