export type DtrDataReportType = "dp" | "ls" | "ip";

export interface DtrDataColumn {
  key: string;
  header: string;
}

/** Shared identity fields; metric keys vary by reportType. */
export interface DtrDataRow {
  id: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  meterSerialNumber: string;
  meterTime: string;
  mf: string;
  meterLookupId: number;
  dataSource?: string | null;
  /** DP metrics */
  kWhImp?: string | null;
  kWhExp?: string | null;
  kVAhImp?: string | null;
  kVAhExp?: string | null;
  /** LS metrics */
  ir?: string | null;
  iy?: string | null;
  ib?: string | null;
  vlR?: string | null;
  vlY?: string | null;
  vlB?: string | null;
  kWh?: string | null;
  kVAh?: string | null;
  rPf?: string | null;
  yPf?: string | null;
  bPf?: string | null;
  avgPf?: string | null;
  kW?: string | null;
  kVA?: string | null;
  kVAR?: string | null;
  freq?: string | null;
  [key: string]: string | number | null | undefined;
}

export interface DtrDataPagination {
  page: number;
  limit: number;
  /** Null when `includeTotal=false` — rows may still be present. */
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface DtrDataDataModel {
  columns: DtrDataColumn[];
  rows: DtrDataRow[];
  pagination: DtrDataPagination;
}

export interface DtrDataErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: {
      reportId?: string;
      reason?: string;
      maximumInteractiveRangeDays?: number;
      requestedRangeDays?: number;
      exportSupported?: boolean;
      reportType?: string;
    };
  };
}

export interface DtrDataResponse {
  success: boolean;
  data?: DtrDataDataModel | null;
  message?: string;
  error?: DtrDataErrorBody["error"];
}

export interface MappedDtrData {
  success: boolean;
  columns: DtrDataColumn[];
  rows: DtrDataRow[];
  pagination: DtrDataPagination;
}

export type DtrDataScenario =
  | "dev_live_primary"
  | "dev_live_ls"
  | "dev_live_dp_week"
  | "dev_live_include_total"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "dev_dp_range_too_long"
  | "contract_live_ip"
  | "contract_live_ls"
  | "contract_empty_page"
  | "invalid_report_type"
  | "invalid_date_range"
  | "missing_from_date"
  | "missing_to_date"
  | "invalid_page"
  | "invalid_limit";

const EMPTY_PAGINATION: DtrDataPagination = {
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

export class DtrDataMapper {
  static map(response: DtrDataResponse): MappedDtrData {
    const data = response.data ?? ({} as DtrDataDataModel);
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
