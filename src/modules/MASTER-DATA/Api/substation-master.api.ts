import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  SubstationMasterQuery,
  SubstationMasterResponse,
} from "../Mapper/substation-master.mapper";
import { fetchMasterDataJson } from "../utils/master-data-request.helper";

export interface SubstationMasterApiResult {
  rawResponse: APIResponse;
  responseBody: SubstationMasterResponse;
  responseTime: number;
}

export class SubstationMasterApi {
  constructor(private readonly request: APIRequestContext) {}

  async getSubstationMasterData(
    query: SubstationMasterQuery = { page: 1, limit: 20 },
  ): Promise<SubstationMasterApiResult> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.q?.trim()) params.q = query.q.trim();

    const { rawResponse, responseBody, responseTime } =
      await fetchMasterDataJson<SubstationMasterResponse>(
        this.request,
        "/indore/master-data/substation-master-data",
        params,
      );

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
