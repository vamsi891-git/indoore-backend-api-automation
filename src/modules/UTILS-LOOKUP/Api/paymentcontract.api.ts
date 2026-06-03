// Api/paymentcontract.api.ts
import { APIRequestContext, APIResponse } from "@playwright/test";
import { PaymentContractResponse } from "../Mapper/paymentcontract.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
export interface PaymentContractApiResponse {
  rawResponse: APIResponse;
  responseBody: PaymentContractResponse;
  responseTime: number;
}
export class PaymentContractApi {
  constructor(private authenticatedApi: APIRequestContext) {}
  async getPaymentContracts(): Promise<PaymentContractApiResponse> {
    const start = Date.now();
    const rawResponse = await getWithAutoRefresh(this.authenticatedApi,"/indore/utils/payment-contracts");
    return {
      rawResponse,
      responseBody: await rawResponse.json(),
      responseTime: Date.now() - start
    };
  }
}
