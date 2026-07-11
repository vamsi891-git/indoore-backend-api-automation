import { APIRequestContext, APIResponse } from "@playwright/test";
import { OrganisationResponse } from "../Mapper/organizationhierarchy.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface OrganisationApiResponse {
  rawResponse: APIResponse;
  responseBody: OrganisationResponse;
  responseTime: number;
}

export class OrganisationApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getOrganisationHierarchy(): Promise<OrganisationApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<OrganisationResponse>(
        this.authenticatedApi,
        "/indore/utils/hierarchies/organisation",
        "organisation-hierarchy",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
