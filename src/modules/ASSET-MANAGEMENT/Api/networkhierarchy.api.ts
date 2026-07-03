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
    async getNetworkHierarchy(
        rootId?: number,
        requestTimeoutMs?: number,
    ): Promise<NetworkHierarchyApiResponse> {
        const start = Date.now();
        const query = rootId != null ? `?rootId=${rootId}` : "";
        const rawResponse = await getWithAutoRefresh(
            this.authenticatedApi,
            `/indore/asset-management/network-hierarchy${query}`,
            requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {},
        );
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