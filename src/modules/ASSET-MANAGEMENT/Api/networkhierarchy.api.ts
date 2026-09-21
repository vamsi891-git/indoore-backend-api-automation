import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { NetworkHierarchyResponse } from "../Mapper/networkhierarchy.mapper";

export type NetworkHierarchyApiResult = ApiCallResult<NetworkHierarchyResponse>;

export class NetworkHierarchyApi extends TimedApiClient {
  getNetworkHierarchy(
    rootId?: number,
    requestTimeoutMs?: number,
  ): Promise<NetworkHierarchyApiResult> {
    const query = rootId != null ? `?rootId=${rootId}` : "";
    return this.getJson<NetworkHierarchyResponse>(
      `/indore/asset-management/network-hierarchy${query}`,
      {
        timeout: requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      },
    );
  }
}
