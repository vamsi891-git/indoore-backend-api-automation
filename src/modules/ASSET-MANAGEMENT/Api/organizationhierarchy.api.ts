import { APIRequestContext, APIResponse} from "@playwright/test";
import { OrganisationHierarchyResponse} from "../Mapper/organizationhierarchy.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface OrganisationHierarchyApiResponse {
    rawResponse:
    APIResponse;
    responseBody:
    OrganisationHierarchyResponse;
    responseTime:
    number;
}
export class OrganisationHierarchyApi {
    constructor(private authenticatedApi:APIRequestContext) { }
    async getOrganisationHierarchy(
        rootId?: number,
        requestTimeoutMs?: number,
    ): Promise<OrganisationHierarchyApiResponse> {
        const start =Date.now();
        const query = rootId != null ? `?rootId=${rootId}` : "";
        const rawResponse = await getWithAutoRefresh(
            this.authenticatedApi,
            `/indore/asset-management/organisation-hierarchy${query}`,
            requestTimeoutMs != null ? { timeout: requestTimeoutMs } : {},
        );
        const responseBody =await rawResponse.json();
        const responseTime =Date.now() - start;
        return {
            rawResponse,
            responseBody,
            responseTime
        }
    }
}