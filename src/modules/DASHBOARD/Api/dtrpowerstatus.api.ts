import {APIRequestContext,APIResponse} from "@playwright/test";
import {  DtrPowerStatusResponse } from "../Mapper/dtrpowerstatus.mapper";
export interface DtrPowerStatusApiResponse {
    rawResponse: APIResponse;
    responseBody: DtrPowerStatusResponse;
    responseTime: number;
}
export class DtrPowerStatusApi {
    constructor( private request: APIRequestContext) { }
    async getDtrPowerStatus():
        Promise<DtrPowerStatusApiResponse> {
        const start = Date.now();
        const rawResponse =
            await this.request.get(
                "/indore/dashboard/dtr/power-status"
            );
        const responseBody =
        await rawResponse.json();
        const responseTime =
        Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };
    }
}