import { APIRequestContext,APIResponse } from "@playwright/test";
import { dtrCommunicationResponse } from "../Mapper/dtrcommunication.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DtrCommunicationAPiResult {
    rawResponse:APIResponse;
    responseBody:dtrCommunicationResponse;
    responseTime:number;
}
export class DtrCommunicationApi{
    constructor(private readonly authenticatedAPi:APIRequestContext){}
    async getDtrCommunicationStatus(params:Record<string,string|number|boolean>):Promise<DtrCommunicationAPiResult>{
        const start = Date.now();
        const response = await getWithAutoRefresh(this.authenticatedAPi,"/indore/dashboard/dtr/communication-status",{params});
        const responseTime = Date.now()-start;
        return {
            rawResponse:response,
            responseBody: await response.json(),
            responseTime
        };
    }
}