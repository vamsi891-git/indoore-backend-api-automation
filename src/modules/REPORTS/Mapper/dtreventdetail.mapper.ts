export const dtrEventDetailColumnKeys = [
  "slNo",
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "dtrType",
  "dtrRating",
  "msn",
  "logDate",
  "eventClassificationName",
  "eventName",
  "priority",
  "eventCount",
  "durationHhMm",
] as const;

export type DtrEventDetailColumnKey = (typeof dtrEventDetailColumnKeys)[number];

export interface DtrEventDetailColumn {
  key: string;
  header: string;
}

export interface DtrEventDetailRow {
  id: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  dtrType: string;
  dtrRating: number | null;
  msn: string;
  logDate: string;
  eventClassificationName: string;
  eventName: string;
  priority: string;
  eventCount: number;
  durationHhMm: string;
  dtrNetworkLookupId?: number;
  meterLookupId?: number;
  eventId?: number;
}

export interface DtrEventDetailPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface DtrEventDetailDataModel {
  columns: DtrEventDetailColumn[];
  rows: DtrEventDetailRow[];
  pagination: DtrEventDetailPagination;
}

export interface DtrEventDetailErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface DtrEventDetailResponse {
  success: boolean;
  data?: DtrEventDetailDataModel | null;
  message?: string;
  error?: DtrEventDetailErrorBody["error"];
}

export interface MappedDtrEventDetail {
  success: boolean;
  columns: DtrEventDetailColumn[];
  rows: DtrEventDetailRow[];
  pagination: DtrEventDetailPagination;
}

export type DtrEventDetailScenario =
  | "dev_live_primary"
  | "dev_live_page2"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "contract_live_full"
  | "contract_empty_page"
  | "invalid_date_range"
  | "invalid_date_format"
  | "invalid_to_date"
  | "missing_from_date"
  | "missing_to_date"
  | "invalid_page"
  | "invalid_limit";

const EMPTY_PAGINATION: DtrEventDetailPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  totalIsExact: null,
  hasMore: null,
};

export class DtrEventDetailMapper {
  static map(response: DtrEventDetailResponse): MappedDtrEventDetail {
    const data = response.data ?? ({} as DtrEventDetailDataModel);
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: response.success,
      columns: data.columns ?? [],
      rows: data.rows ?? [],
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 10),
        total: Number(pagination.total ?? 0),
        totalPages: Number(pagination.totalPages ?? 0),
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
