export type ConsumerReportType = "ls" | "dp" | "ip";

export interface ConsumerReportColumn {
  key: string;
  header: string;
}

export interface ConsumerReportRow {
  id: string;
  slNo: number;
  dateTime: string;
  kWh?: string | null;
  kVAh?: string | null;
  voltage?: string | null;
  current?: string | null;
  phases?: unknown;
  name?: string | null;
  address?: string | null;
  ivrsNumber?: string | null;
  msn?: string | null;
  mf?: string | null;
  cur?: string | null;
  pf?: string | null;
  kW?: string | null;
  kva?: string | null;
  freq?: string | null;
  neutralCurrent?: string | null;
  sourceId?: string | null;
  [key: string]: string | number | null | undefined | unknown;
}

export interface ConsumerReportPagination {
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface ConsumerReportDataModel {
  columns: ConsumerReportColumn[];
  rows: ConsumerReportRow[];
  pagination: ConsumerReportPagination;
}

export interface ConsumerReportErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface ConsumerReportResponse {
  success: boolean;
  data?: ConsumerReportDataModel | null;
  message?: string;
  error?: ConsumerReportErrorBody["error"];
}

export interface MappedConsumerReport {
  success: boolean;
  columns: ConsumerReportColumn[];
  rows: ConsumerReportRow[];
  pagination: ConsumerReportPagination;
}

export type ConsumerReportScenario =
  | "dev_live_ls"
  | "dev_live_dp"
  | "dev_live_ip"
  | "dev_live_ls_without_total"
  | "dev_live_page_beyond"
  | "dev_ignore_unknown_query"
  | "dev_limit_one"
  | "contract_live_ls"
  | "contract_live_dp"
  | "contract_live_ip"
  | "contract_empty_page"
  | "invalid_report_type"
  | "invalid_date_range"
  | "invalid_date_format"
  | "missing_from_date"
  | "missing_meter_serial"
  | "missing_report_type";

const EMPTY_PAGINATION: ConsumerReportPagination = {
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

export class ConsumerReportMapper {
  static map(response: ConsumerReportResponse): MappedConsumerReport {
    const data = response.data ?? ({} as ConsumerReportDataModel);
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
    };
  }
}
