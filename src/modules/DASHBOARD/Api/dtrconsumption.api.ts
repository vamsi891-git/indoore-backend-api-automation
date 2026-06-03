import { APIRequestContext, APIResponse} from "@playwright/test";
import { DtrConsumptionResponse} from "../Mapper/dtrconsumption.mapper";
export interface DtrConsumptionApiResponse {
    rawResponse: APIResponse;
    responseBody: DtrConsumptionResponse;
    responseTime: number;
}
export class DtrConsumptionApi {
    constructor(private request: APIRequestContext) { }
    async getDtrConsumption():
        Promise<DtrConsumptionApiResponse> {
        const start = Date.now();
        const rawResponse =await this.request.get("/indore/dashboard/dtr/consumption");
        const responseBody =await rawResponse.json();
        const responseTime =Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };
    }
}