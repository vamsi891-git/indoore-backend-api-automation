import { APIRequestContext, APIResponse } from "@playwright/test";
import { DtrMasterResponse } from "../Mapper/dtr-master.mapper";
export interface DtrMasterApiResponse {
  rawResponse: APIResponse;
  responseBody: DtrMasterResponse;
  responseTime: number;
}
export class DtrMasterApi {
  constructor(private request: APIRequestContext) {}
  async getDtrMasterData(page = 1, limit = 20): Promise<DtrMasterApiResponse> {
    const start = Date.now();
    const rawResponse = await this.request.get(
      `/indore/master-data/dtr-master-data?page=${page}&limit=${limit}`,
    );
    const responseBody: DtrMasterResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
