// Api/substation-master.api.ts

import { APIRequestContext, APIResponse } from "@playwright/test";
import { SubstationMasterResponse } from "../Mapper/substation-master.mapper";

export interface SubstationMasterApiResponse {
  rawResponse: APIResponse;

  responseBody: SubstationMasterResponse;
  responseTime: number;
}
export class SubstationMasterApi {
  constructor(private request: APIRequestContext) {}
  async getSubstationMasterData(
    page = 1,
    limit = 20,
  ): Promise<SubstationMasterApiResponse> {
    const start = Date.now();
    const rawResponse = await this.request.get(
      `/indore/master-data/substation-master-data?page=${page}&limit=${limit}`,
    );
    const responseBody: SubstationMasterResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
