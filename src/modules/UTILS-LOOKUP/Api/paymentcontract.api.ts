// Api/paymentcontract.api.ts
/**
 * =============================================================================
 * BACKEND ISSUES — GET /indore/utils/payment-contracts
 * Reference: Consumer Bulk §2 "Connection Type must be valid"
 * Probe: reports/probe-hierarchy.txt (2026-07-07)
 * =============================================================================
 *
 * ISSUE 1 — Wrong endpoint name for "Connection Type"
 * --------------------------------
 * Manual rule labels the field "Connection Type" (Prepaid / Postpaid).
 * Backend exposes values only via payment-contracts, not connection-types.
 *
 * Proof (this endpoint — HTTP 200):
 * {
 *   "success": true,
 *   "data": {
 *     "items": [
 *       { "id": 1, "name": "Prepaid",  "code": "Prepaid" },
 *       { "id": 2, "name": "Postpaid", "code": "Postpaid" }
 *     ]
 *   }
 * }
 *
 * Proof (dedicated route missing — HTTP 404 HTML):
 *   GET /indore/utils/connection-types
 *   Body: Cannot GET /utils/connection-types
 *
 * Impact: consumer-lookup.helper.ts maps Connection Type → payment-contracts.
 *         UI/manual spec says "Connection Type"; API name is "payment-contract".
 * Action: Add GET /indore/utils/connection-types OR document alias in API spec.
 *
 * ISSUE 2 — No billing-cycle / TOD / main-sub lookup siblings
 * --------------------------------
 * Same probe file: billing-cycles, tod, main-sub-meter routes all 404.
 * Billing Cycle and TOD cannot be resolved from UTILS-LOOKUP (env ids used).
 */
import { APIRequestContext, APIResponse } from "@playwright/test";
import { PaymentContractResponse } from "../Mapper/paymentcontract.mapper";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { parseLookupJsonResponse } from "../utils/lookup-api-parse.helper";
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
      responseBody: await parseLookupJsonResponse<PaymentContractResponse>(
        rawResponse,
        "payment-contracts",
      ),
      responseTime: Date.now() - start
    };
  }
}
