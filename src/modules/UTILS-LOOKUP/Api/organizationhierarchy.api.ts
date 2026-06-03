import { APIRequestContext, APIResponse } from "@playwright/test";
import { OrganisationResponse } from "../Mapper/organizationhierarchy.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface OrganisationApiResponse {
  rawResponse: APIResponse;
  responseBody: OrganisationResponse;
  responseTime: number;
}

export class OrganisationApi {
            constructor(private authenticatedApi: APIRequestContext) {}
  async getOrganisationHierarchy(): Promise<OrganisationApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/hierarchies/organisation");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
