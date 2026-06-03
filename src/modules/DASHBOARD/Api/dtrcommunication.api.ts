import { APIRequestContext, APIResponse } from "@playwright/test";
import { DtrCommunicationResponse } from "../Mapper/dtrcommunication.mapper";
export interface DtrCommunicationApiResult {
    rawResponse: APIResponse;
    responseBody: DtrCommunicationResponse;
    responseTime: number;
}
export class DtrCommunicationApi {
    constructor(private request:APIRequestContext) { }
    async getDtrCommunicationStatus(page: number,limit: number):Promise<DtrCommunicationApiResult> {
        const start = Date.now();
        const rawResponse =await this.request.get(`/indore/dashboard/dtr/communication-status?page=${page}&limit=${limit}`);
        const responseBody = await rawResponse.json();
        const responseTime = Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };

    }

}