import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { OrganisationHierarchyResponse } from "../Mapper/organizationhierarchy.mapper";

export type OrganisationHierarchyApiResult = ApiCallResult<OrganisationHierarchyResponse>;

export class OrganisationHierarchyApi extends TimedApiClient {
  getOrganisationHierarchy(
    rootId?: number,
    requestTimeoutMs?: number,
  ): Promise<OrganisationHierarchyApiResult> {
    const query = rootId != null ? `?rootId=${rootId}` : "";
    return this.getJson<OrganisationHierarchyResponse>(
      `/indore/asset-management/organisation-hierarchy${query}`,
      {
        timeout: requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      },
    );
  }
}
