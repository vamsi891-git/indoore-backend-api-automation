import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  FeederMasterQuery,
  FeederMasterResponse,
} from "../Mapper/feeder-master.mapper";
import { fetchMasterDataJson } from "../utils/master-data-request.helper";

export interface FeederMasterApiResult {
  rawResponse: APIResponse;
  responseBody: FeederMasterResponse;
  responseTime: number;
}

export class FeederMasterApi {
  constructor(private readonly request: APIRequestContext) {}

  async getFeederMasterData(
    query: FeederMasterQuery = { page: 1, limit: 20 },
  ): Promise<FeederMasterApiResult> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.q?.trim()) params.q = query.q.trim();

    const { rawResponse, responseBody, responseTime } =
      await fetchMasterDataJson<FeederMasterResponse>(
        this.request,
        "/indore/master-data/feeder-master-data",
        params,
      );

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
