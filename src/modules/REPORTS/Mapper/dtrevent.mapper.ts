export const dtrEventColumnKeys = [
  "slNo",
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dt",
  "dtrMeterNo",
  "dtrRatingKva",
  "eventCount",
  "durationHhMmSs",
] as const;

export type DtrEventColumnKey = (typeof dtrEventColumnKeys)[number];

export interface DtrEventColumn {
  key: string;
  header: string;
}

export interface DtrEventRow {
  id: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dt: string;
  dtrMeterNo: string;
  dtrRatingKva: number | string | null;
  eventCount: number;
  durationHhMmSs: string;
  dtrNetworkLookupId?: number;
  meterLookupId?: number;
  eventId?: number;
}

export interface DtrEventPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface DtrEventDataModel {
  columns: DtrEventColumn[];
  rows: DtrEventRow[];
  pagination: DtrEventPagination;
}

export interface DtrEventErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface DtrEventResponse {
  success: boolean;
  data?: DtrEventDataModel | null;
  message?: string;
  error?: DtrEventErrorBody["error"];
}

export interface MappedDtrEvent {
  success: boolean;
  columns: DtrEventColumn[];
  rows: DtrEventRow[];
  pagination: DtrEventPagination;
}

export type DtrEventScenario =
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

const EMPTY_PAGINATION: DtrEventPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  totalIsExact: null,
  hasMore: null,
};

export class DtrEventMapper {
  static map(response: DtrEventResponse): MappedDtrEvent {
    const data = response.data ?? ({} as DtrEventDataModel);
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
