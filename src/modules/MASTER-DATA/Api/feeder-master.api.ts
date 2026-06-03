// Api/feeder-master.api.ts
import { APIRequestContext, APIResponse } from "@playwright/test";
import { FeederMasterResponse } from "../Mapper/feeder-master.mapper";
export interface FeederMasterApiResponse {
  rawResponse: APIResponse;
  responseBody: FeederMasterResponse;
  responseTime: number;
}
export class FeederMasterApi {
  constructor(private request: APIRequestContext) {}
  async getFeederMasterData(
    page = 1,
    limit = 20,
  ): Promise<FeederMasterApiResponse> {
    const start = Date.now();
    const rawResponse = await this.request.get(
      `/indore/master-data/feeder-master-data?page=${page}&limit=${limit}`,
    );
    const responseBody: FeederMasterResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
