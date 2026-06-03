import { APIRequestContext,APIResponse } from "@playwright/test";
import { EventRestorationResponse } from "../Mapper/eventrestoration.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface EventRestorationApiResult{
    rawResponse:APIResponse;
    responseBody:EventRestorationResponse;
    responseTime:number;
}
export class EventRestorationApi {
    constructor(private readonly authenticatedApi:APIRequestContext){}
    async getEventRestoration(params:Record<string,string | number |boolean >):Promise<EventRestorationApiResult>{
        const start = Date.now();
        const response = await getWithAutoRefresh(this.authenticatedApi,"/indore/reports/event-restoration",{params});
        const responseTime = Date.now() - start;
        if(!response.ok()){
            throw new Error(`Status:${response.status()} Body:${await response.text()}`);

        }
        return {
            rawResponse:response,
            responseBody:await response.json(),
            responseTime
        };
    }

}