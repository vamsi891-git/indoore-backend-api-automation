export interface DtrBillingColumn {
  key: string;
  header: string;
}

export interface DtrBillingPagination {
  page: number;
  limit: number;
  /** Null when `includeTotal=false` — rows may still be present. */
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface DtrBillingRow {
  id: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  dtrRating?: number | string | null;
  meterSerialNumber: string;
  meterTime: string;
  billingDate: string;
  kwhImp: string | null;
  kwhExp: string | null;
  kvahImp: string | null;
  kvahExp: string | null;
  kwImp: string | null;
  kwDateTime: string | null;
  kvaImp: string | null;
  kvaDateTime: string | null;
  mf: string;
  [key: string]: string | number | null | undefined;
}

export interface DtrBillingReportData {
  columns: DtrBillingColumn[];
  rows: DtrBillingRow[];
  pagination: DtrBillingPagination;
}

export interface DtrBillingErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface DtrBillingResponse {
  success: boolean;
  data?: DtrBillingReportData | null;
  message?: string;
  error?: DtrBillingErrorBody["error"];
}

/** Nested `data` kept for DB harness / soft-DB consumers. */
export interface MappedDtrBilling {
  success: boolean;
  data: DtrBillingReportData;
}

export type DtrBillingScenario =
  | "dev_live_without_total"
  | "dev_live_include_total"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "edge_duplicate_meter_serials"
  | "contract_live_oct_2025"
  | "contract_empty_page"
  | "invalid_date_range"
  | "invalid_from_date"
  | "missing_from_date"
  | "missing_to_date"
  | "invalid_page"
  | "invalid_limit";

export const dtrBillingColumnKeys = [
  "slNo",
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "dtrRating",
  "meterSerialNumber",
  "meterTime",
  "billingDate",
  "kwhImp",
  "kwhExp",
  "kvahImp",
  "kvahExp",
  "kwImp",
  "kwDateTime",
  "kvaImp",
  "kvaDateTime",
  "mf",
] as const;

const EMPTY_PAGINATION: DtrBillingPagination = {
  page: 1,
  limit: 10,
  total: null,
  totalPages: null,
  totalIsExact: null,
  hasMore: null,
};

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export class DtrBillingMapper {
  static map(response: DtrBillingResponse | Record<string, unknown>): MappedDtrBilling {
    const body = response as DtrBillingResponse;
    const data = body.data ?? ({} as DtrBillingReportData);
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: Boolean(body.success),
      data: {
        columns: data.columns ?? [],
        rows: (data.rows ?? []) as DtrBillingRow[],
        pagination: {
          page: Number(pagination.page ?? 1),
          limit: Number(pagination.limit ?? 10),
          total: nullableNumber(pagination.total),
          totalPages: nullableNumber(pagination.totalPages),
          totalIsExact:
            pagination.totalIsExact === undefined
              ? null
              : Boolean(pagination.totalIsExact),
          hasMore:
            pagination.hasMore === undefined
              ? null
              : Boolean(pagination.hasMore),
        },
      },
    };
  }
}
