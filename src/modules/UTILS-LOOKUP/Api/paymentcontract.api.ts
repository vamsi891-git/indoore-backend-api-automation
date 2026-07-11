import { APIRequestContext, APIResponse } from "@playwright/test";
import { PaymentContractResponse } from "../Mapper/paymentcontract.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface PaymentContractApiResponse {
  rawResponse: APIResponse;
  responseBody: PaymentContractResponse;
  responseTime: number;
}

export class PaymentContractApi {
  constructor(private authenticatedApi: APIRequestContext) {}

  async getPaymentContracts(): Promise<PaymentContractApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<PaymentContractResponse>(
        this.authenticatedApi,
        "/indore/utils/payment-contracts",
        "payment-contracts",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
