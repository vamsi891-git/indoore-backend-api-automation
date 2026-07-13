import { APIRequestContext, APIResponse } from "@playwright/test";
import { OrganizationResponse } from "../Mapper/searchorganization.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface OrganizationSearchApiResponse {
  rawResponse: APIResponse;
  responseBody: OrganizationResponse;
  responseTime: number;
}

export interface OrganizationSearchQuery {
  limit?: number;
}

export class OrganizationApi {
  static readonly PATH = "/indore/utils/search/organisations";

  constructor(private authenticatedApi: APIRequestContext) {}

  async searchOrganizations(
    query: OrganizationSearchQuery = { limit: 20 },
  ): Promise<OrganizationSearchApiResponse> {
    const path = OrganizationApi.toPath(query);
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<OrganizationResponse>(
        this.authenticatedApi,
        path,
        "organisation-search",
      );
    return { rawResponse, responseBody, responseTime };
  }

  private static toPath(query: OrganizationSearchQuery): string {
    const params = new URLSearchParams();
    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }
    const qs = params.toString();
    return `${OrganizationApi.PATH}${qs ? `?${qs}` : ""}`;
  }
}
