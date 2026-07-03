import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  MeterMasterQuery,
  MeterMasterResponse,
} from "../Mapper/meter-master.mapper";
import { fetchMasterDataJson } from "../utils/master-data-request.helper";

export interface MeterMasterApiResult {
  rawResponse: APIResponse;
  responseBody: MeterMasterResponse;
  responseTime: number;
}

export class MeterMasterApi {
  constructor(private readonly request: APIRequestContext) {}

  async getMeterMasterData(
    query: MeterMasterQuery = { page: 1, limit: 20 },
  ): Promise<MeterMasterApiResult> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.q?.trim()) {
      params.q = query.q.trim();
    }

    const { rawResponse, responseBody, responseTime } =
      await fetchMasterDataJson<MeterMasterResponse>(
        this.request,
        "/indore/master-data/meter-master-data",
        params,
      );

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
