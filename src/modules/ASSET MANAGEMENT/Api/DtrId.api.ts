import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {DtrDetailResponse} from "../Mapper/dtrId.mapper";
export interface DtrApiResponse {
    rawResponse: APIResponse;
    responseBody: DtrDetailResponse;
    responseTime: number;
}
export class DtrDetailApi {
    constructor(private authenticatedApi:APIRequestContext) { }
    async getDtrDetails(
        dtrId: number,
        page: number,
        limit: number
    ):
     Promise<DtrApiResponse> {
        const start =Date.now();
        const rawResponse =await getWithAutoRefresh(this.authenticatedApi,
                `/indore/asset-management/dtr/${dtrId}?page=${page}&limit=${limit}`
            );
        const responseBody =await rawResponse.json();
        const responseTime =Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };
    }
}