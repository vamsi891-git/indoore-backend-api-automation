import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  BILLING_PATH,
  BillingRequestBody,
} from "../Data/commands-billing.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";

export interface CommandsBillingApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsBillingApi {
  constructor(private request: APIRequestContext) {}

  async postBilling(
    body: BillingRequestBody,
  ): Promise<CommandsBillingApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      BILLING_PATH,
      body,
    );
    const responseBody = (await rawResponse.json()) as CommandJobInitResponse;
    return {
      rawResponse,
      responseBody,
      responseTime,
    };
  }
}
