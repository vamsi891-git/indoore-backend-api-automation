export const eventRestorationColumnKeys = [
  "slNo",
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "name",
  "address",
  "ivrsNumber",
  "tariff",
  "msn",
  "phase",
  "eventClassificationName",
  "eventName",
  "occurrenceTime",
] as const;

export type EventRestorationColumnKey =
  (typeof eventRestorationColumnKeys)[number];

export interface EventRestorationColumn {
  key: string;
  header: string;
}

export interface EventRestorationRow {
  id: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  name: string;
  address: string;
  ivrsNumber: string;
  tariff: string;
  msn: string;
  phase: string;
  eventClassificationName: string;
  eventName: string;
  occurrenceTime: string;
}

export interface EventRestorationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface EventRestorationDataModel {
  columns: EventRestorationColumn[];
  rows: EventRestorationRow[];
  pagination: EventRestorationPagination;
}

export interface EventRestorationErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface EventRestorationResponse {
  success: boolean;
  data?: EventRestorationDataModel | null;
  message?: string;
  error?: EventRestorationErrorBody["error"];
}

export interface MappedEventRestoration {
  success: boolean;
  columns: EventRestorationColumn[];
  rows: EventRestorationRow[];
  pagination: EventRestorationPagination;
}

export type EventRestorationScenario =
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

const EMPTY_PAGINATION: EventRestorationPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  totalIsExact: null,
  hasMore: null,
};

export class EventRestorationMapper {
  static map(response: EventRestorationResponse): MappedEventRestoration {
    const data = response.data ?? ({} as EventRestorationDataModel);
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
