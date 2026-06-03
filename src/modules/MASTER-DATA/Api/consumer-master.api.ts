import { APIRequestContext, APIResponse } from "@playwright/test";
import { ConsumerMasterResponse } from "../Mapper/consumer-master.mapper";
export interface ConsumerMasterApiResponse {
  rawResponse: APIResponse;
  responseBody: ConsumerMasterResponse;
  responseTime: number;
}

export class ConsumerMasterApi {
  constructor(private request: APIRequestContext) {}
  async getConsumerMasterData(
    page = 1,
    limit = 20,
  ): Promise<ConsumerMasterApiResponse> {
    const start = Date.now();
    const rawResponse = await this.request.get(
      `/indore/master-data/consumer-master-data?page=${page}&limit=${limit}`,
    );
    const responseBody: ConsumerMasterResponse = await rawResponse.json();
    const responseTime = Date.now() - start;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
