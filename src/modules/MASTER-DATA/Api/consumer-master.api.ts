import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  ConsumerMasterQuery,
  ConsumerMasterResponse,
} from "../Mapper/consumer-master.mapper";
import { fetchMasterDataJson } from "../utils/master-data-request.helper";

export interface ConsumerMasterApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumerMasterResponse;
  responseTime: number;
}

export class ConsumerMasterApi {
  constructor(private readonly request: APIRequestContext) {}

  async getConsumerMasterData(
    query: ConsumerMasterQuery = { page: 1, limit: 20 },
  ): Promise<ConsumerMasterApiResult> {
    const params: Record<string, string | number | boolean> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      meterType: query.meterType ?? "all",
    };

    if (query.q?.trim()) params.q = query.q.trim();
    if (query.connectionStatusTblRefId != null) {
      params.connectionStatusTblRefId = query.connectionStatusTblRefId;
    }
    if (query.categoryTblRefId != null) {
      params.categoryTblRefId = query.categoryTblRefId;
    }
    if (query.isNetMeter != null) params.isNetMeter = query.isNetMeter;

    const { rawResponse, responseBody, responseTime } =
      await fetchMasterDataJson<ConsumerMasterResponse>(
        this.request,
        "/indore/master-data/consumer-master-data",
        params,
      );

    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
