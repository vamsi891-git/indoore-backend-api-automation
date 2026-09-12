export interface BillingHistoryRow {
  periodLabel: string | null;
  consumptionKwh: number | null;
  billAmount: number | null;
  consumptionSummaryText: string;
  paymentStatus: string | null;
}

/** Paginated envelope returned by live billing-history. */
export interface BillingHistoryPage {
  items: BillingHistoryRow[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface BillingHistoryResponse {
  success: boolean;
  /** Legacy bare array or live `{ items, page, ... }` envelope. */
  data?: BillingHistoryRow[] | BillingHistoryPage | null;
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

function extractBillingHistoryItems(
  data: BillingHistoryResponse["data"],
): BillingHistoryRow[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}

export class BillingHistoryMapper {
  static map(response: BillingHistoryResponse): MappedBillingHistory {
    return {
      success: response.success,
      items: extractBillingHistoryItems(response.data),
    };
  }
}
