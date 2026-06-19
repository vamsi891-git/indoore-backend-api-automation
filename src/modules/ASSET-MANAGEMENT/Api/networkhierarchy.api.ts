import {APIRequestContext,APIResponse} from "@playwright/test";
import {NetworkHierarchyResponse} from "../Mapper/networkhierarchy.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface NetworkHierarchyApiResponse {
    rawResponse: APIResponse;
    responseBody:
    NetworkHierarchyResponse;
    responseTime: number;
}
export class NetworkHierarchyApi {
    constructor(private authenticatedApi:APIRequestContext) { }
    async getNetworkHierarchy():
        Promise<NetworkHierarchyApiResponse> {
        const start = Date.now();
        const rawResponse =await getWithAutoRefresh(this.authenticatedApi,"/indore/asset-management/network-hierarchy");
        const responseBody:NetworkHierarchyResponse =
        await rawResponse.json();
        const responseTime = Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        };

    }

}