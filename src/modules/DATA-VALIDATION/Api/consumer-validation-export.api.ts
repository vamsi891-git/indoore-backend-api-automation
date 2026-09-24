import { APIRequestContext, APIResponse } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import {
  consumerValidationExportMaxResponseTimeMs,
  consumerValidationExportPath,
  consumerValidationExportQueryString,
  type ConsumerValidationExportQuery,
} from "../Data/consumer-validation.data";

export interface ConsumerValidationExportApiResult {
  rawResponse: APIResponse;
  body: Buffer;
  contentType: string;
  contentDisposition: string;
  responseTime: number;
}

export class ConsumerValidationExportApi {
  constructor(private readonly authenticatedApi: APIRequestContext) {}

  async exportConsumerValidation(
    query: ConsumerValidationExportQuery,
  ): Promise<ConsumerValidationExportApiResult> {
    const start = Date.now();
    const qs = consumerValidationExportQueryString(query);
    const rawResponse = await getWithAutoRefresh(
      this.authenticatedApi,
      `${consumerValidationExportPath}${qs ? `?${qs}` : ""}`,
      {
        timeout: consumerValidationExportMaxResponseTimeMs,
      },
    );
    const body = Buffer.from(await rawResponse.body());
    const headers = rawResponse.headers();
    return {
      rawResponse,
      body,
      contentType: headers["content-type"] ?? "",
      contentDisposition: headers["content-disposition"] ?? "",
      responseTime: Date.now() - start,
    };
  }
}
