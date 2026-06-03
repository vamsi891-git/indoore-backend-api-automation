// Api/organisationsearch.api.ts

import { APIRequestContext, APIResponse } from "@playwright/test";
import { OrganizationResponse } from "../Mapper/searchorganization.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface OrganizationApiResponse {
  rawResponse: APIResponse;
  responseBody: OrganizationResponse;
  responseTime: number;
}
export class OrganizationApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async searchOrganizations(
    limit: number = 20,
  ): Promise<OrganizationApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,`/indore/utils/search/organisations?limit=${limit}`);
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
