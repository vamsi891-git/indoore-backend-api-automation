import { APIRequestContext, APIResponse } from "@playwright/test";
import { PaymentContractResponse } from "../Mapper/paymentcontract.mapper";
import { fetchLookupJson } from "../utils/lookup-request.helper";

export interface PaymentContractApiResponse {
  rawResponse: APIResponse;
  responseBody: PaymentContractResponse;
  responseTime: number;
}

export class PaymentContractApi {
  static readonly PATH = "/indore/utils/payment-contracts";

  constructor(private authenticatedApi: APIRequestContext) {}

  async getPaymentContracts(): Promise<PaymentContractApiResponse> {
    const { rawResponse, responseBody, responseTime } =
      await fetchLookupJson<PaymentContractResponse>(
        this.authenticatedApi,
        PaymentContractApi.PATH,
        "payment-contracts",
      );
    return { rawResponse, responseBody, responseTime };
  }
}
