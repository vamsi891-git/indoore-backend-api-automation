import { APIRequestContext, APIResponse } from "@playwright/test";
import {
  PAYMENT_PATH,
  PaymentRequestBody,
} from "../Data/commands-payment.data";
import { CommandJobInitResponse } from "../shared/commands-job-init.mapper";
import { postCommandsWithRetry } from "../utils/commands-request.helper";

export interface CommandsPaymentApiResult {
  rawResponse: APIResponse;
  responseBody: CommandJobInitResponse;
  responseTime: number;
}

export class CommandsPaymentApi {
  constructor(private request: APIRequestContext) {}

  async postPayment(
    body: PaymentRequestBody,
  ): Promise<CommandsPaymentApiResult> {
    const { rawResponse, responseTime } = await postCommandsWithRetry(
      this.request,
      PAYMENT_PATH,
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
