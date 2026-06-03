import { APIRequestContext, APIResponse} from "@playwright/test";
import { DtrPowerTriangleResponse} from "../Mapper/dtrpowertriangle.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DtrPowerTriangleApiResult {
    rawResponse: APIResponse;
    responseBody: DtrPowerTriangleResponse;
    responseTime: number;
}
export class DtrPowerTriangleApi {
    constructor(private readonly authenticatedApi: APIRequestContext) { }
    async getPowerTriangle(dtrCode: string): Promise<DtrPowerTriangleApiResult> {
        const start = Date.now();
        const response =await getWithAutoRefresh(this.authenticatedApi,`/indore/dtr/${dtrCode}/power-triangle`);
        return {
            rawResponse: response,
            responseBody: await response.json(),
            responseTime: Date.now() - start
        };
    }
}