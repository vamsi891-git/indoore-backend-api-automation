import { APIRequestContext, APIResponse } from "@playwright/test";
import { DtrSearchResponse } from "../Mapper/dtrsearch.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface DtrSearchApiResponse {
  rawResponse: APIResponse;
  responseBody: DtrSearchResponse;
  responseTime: number;
}
export class DtrSearchApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getDtrSearch(): Promise<DtrSearchApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,`/indore/utils/search/dtr?page=1&limit=20`);
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
