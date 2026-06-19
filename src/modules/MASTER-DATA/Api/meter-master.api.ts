import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  MeterMasterQuery,
  MeterMasterResponse,
} from "../Mapper/meter-master.mapper";

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
    const start = Date.now();
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.q?.trim()) {
      params.q = query.q.trim();
    }

    const rawResponse = await this.request.get(
      "/indore/master-data/meter-master-data",
      { params },
    );
    const responseBody = (await rawResponse.json()) as MeterMasterResponse;

    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
