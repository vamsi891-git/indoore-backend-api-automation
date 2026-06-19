import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  FeederMasterQuery,
  FeederMasterResponse,
} from "../Mapper/feeder-master.mapper";

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
    const start = Date.now();
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.q?.trim()) params.q = query.q.trim();

    const rawResponse = await this.request.get(
      "/indore/master-data/feeder-master-data",
      { params },
    );
    const responseBody = (await rawResponse.json()) as FeederMasterResponse;

    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
