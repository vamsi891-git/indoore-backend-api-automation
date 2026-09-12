export const dtrCommunicationReportColumnKeys = [
  "slNo",
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "meterSerialNumber",
  "logDate",
  "ipCount",
  "lsCount",
  "dpCount",
] as const;

export type DtrCommunicationReportColumnKey =
  (typeof dtrCommunicationReportColumnKeys)[number];

export interface DtrCommunicationReportColumn {
  key: string;
  header: string;
}

export interface DtrCommunicationReportRow {
  id: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  meterSerialNumber: string;
  logDate: string;
  ipCount: number | null;
  lsCount: number | null;
  dpCount: number | null;
  meterLookupId: number;
}

export interface DtrCommunicationReportPagination {
  page: number;
  limit: number;
  /** Null when `includeTotal=false`. */
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface DtrCommunicationReportDataModel {
  columns: DtrCommunicationReportColumn[];
  rows: DtrCommunicationReportRow[];
  pagination: DtrCommunicationReportPagination;
}

export interface DtrCommunicationReportErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface DtrCommunicationReportResponse {
  success: boolean;
  data?: DtrCommunicationReportDataModel | null;
  message?: string;
  error?: DtrCommunicationReportErrorBody["error"];
}

export interface MappedDtrCommunicationReport {
  success: boolean;
  columns: DtrCommunicationReportColumn[];
  rows: DtrCommunicationReportRow[];
  pagination: DtrCommunicationReportPagination;
}

export type DtrCommunicationReportScenario =
  | "dev_live_primary"
  | "dev_live_include_total"
  | "dev_live_archive_false"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "contract_live_full"
  | "contract_empty_page"
  | "invalid_date_range"
  | "invalid_date_format"
  | "missing_from_date"
  | "missing_to_date"
  | "invalid_page"
  | "invalid_limit";

const EMPTY_PAGINATION: DtrCommunicationReportPagination = {
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

export class DtrCommunicationReportMapper {
  static map(
    response: DtrCommunicationReportResponse,
  ): MappedDtrCommunicationReport {
    const data = response.data ?? ({} as DtrCommunicationReportDataModel);
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
