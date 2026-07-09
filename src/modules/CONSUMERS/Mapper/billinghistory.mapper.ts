export interface BillingHistoryRow {
  periodLabel: string | null;
  consumptionKwh: number | null;
  billAmount: number | null;
  consumptionSummaryText: string;
  paymentStatus: string | null;
}

export interface BillingHistoryResponse {
  success: boolean;
  data?: BillingHistoryRow[] | null;
}

export interface BillingHistoryErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export type BillingHistoryScenario =
  | "bh_by_ivrs_all"
  | "bh_limit_12"
  | "bh_limit_6"
  | "bh_by_account"
  | "bh_by_meter"
  | "bh_ignore_unknown_query"
  | "contract_empty_24"
  | "contract_empty_12"
  | "contract_nonzero_consumption"
  | "contract_consumption_formula"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "invalid_billing_limit";

export interface MappedBillingHistory {
  success: boolean;
  items: BillingHistoryRow[];
}

export class BillingHistoryMapper {
  static map(response: BillingHistoryResponse): MappedBillingHistory {
    return {
      success: response.success,
      items: Array.isArray(response.data) ? response.data : [],
    };
  }
}
