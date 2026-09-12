export interface BillStatusColumn {
  key: string;
  header: string;
}

/** Grid row when hierarchy breakdown is returned; often empty while summary is filled. */
export interface BillStatusRow {
  id?: string;
  slNo?: number;
  totalConsumer?: number | string | null;
  billGenerated?: number | string | null;
  billNotGenerated?: number | string | null;
  [key: string]: string | number | null | undefined;
}

export interface BillStatusPagination {
  page: number;
  limit: number;
  /** Null when `includeTotal=false`. */
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface BillStatusSummary {
  totalConsumers: number;
  billGenerated: number;
  billNotGenerated: number;
}

export interface BillStatusDataModel {
  columns: BillStatusColumn[];
  rows: BillStatusRow[];
  pagination: BillStatusPagination;
  summary: BillStatusSummary;
}

export interface BillStatusErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface BillStatusResponse {
  success: boolean;
  data?: BillStatusDataModel | null;
  message?: string;
  error?: BillStatusErrorBody["error"];
}

export interface MappedBillStatus {
  success: boolean;
  columns: BillStatusColumn[];
  rows: BillStatusRow[];
  pagination: BillStatusPagination;
  summary: BillStatusSummary | null;
}

export type BillStatusScenario =
  | "dev_live_include_total"
  | "dev_live_without_total"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "contract_live_oct_2025"
  | "contract_empty_summary_zero"
  | "invalid_month"
  | "invalid_year"
  | "missing_year"
  | "missing_month"
  | "invalid_page"
  | "invalid_limit";

export const billStatusColumnKeys = [
  "slNo",
  "totalConsumer",
  "billGenerated",
  "billNotGenerated",
] as const;

const EMPTY_PAGINATION: BillStatusPagination = {
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

function asSummary(value: unknown): BillStatusSummary | null {
  if (value === null || value === undefined || typeof value !== "object") {
    return null;
  }
  const s = value as Record<string, unknown>;
  const totalConsumers = Number(s.totalConsumers);
  const billGenerated = Number(s.billGenerated);
  const billNotGenerated = Number(s.billNotGenerated);
  if (
    !Number.isFinite(totalConsumers) ||
    !Number.isFinite(billGenerated) ||
    !Number.isFinite(billNotGenerated)
  ) {
    return null;
  }
  return { totalConsumers, billGenerated, billNotGenerated };
}

export class BillStatusMapper {
  static map(response: BillStatusResponse): MappedBillStatus {
    const data = response.data ?? ({} as BillStatusDataModel);
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: response.success,
      columns: data.columns ?? [],
      rows: data.rows ?? [],
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
          pagination.hasMore === undefined ? null : Boolean(pagination.hasMore),
      },
      summary: asSummary(data.summary),
    };
  }
}
