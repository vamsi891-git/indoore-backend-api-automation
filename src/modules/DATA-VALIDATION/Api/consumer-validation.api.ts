import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {
  consumerValidationPath,
  consumerValidationQueryString,
} from "../Data/consumer-validation.data";
import {
  ConsumerValidationQuery,
  ConsumerValidationResponse,
} from "../Mapper/consumer-validation.mapper";

export interface ConsumerValidationApiResult {
  rawResponse: APIResponse;
  responseBody: ConsumerValidationResponse;
  responseTime: number;
}

export class ConsumerValidationApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async getConsumerValidation(
    query: ConsumerValidationQuery,
  ): Promise<ConsumerValidationApiResult> {
    const start = Date.now();
    const qs = consumerValidationQueryString(query);
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      `${consumerValidationPath}${qs ? `?${qs}` : ""}`,
    );
    const responseBody = (await rawResponse.json()) as ConsumerValidationResponse;
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }
}
