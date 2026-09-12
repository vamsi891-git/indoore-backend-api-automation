export const eventReportColumnKeys = [
  "circle",
  "eventName",
  "meterCount",
  "eventCount",
  "durationHhMm",
] as const;

export type EventReportColumnKey = (typeof eventReportColumnKeys)[number];

export interface EventReportColumn {
  key: string;
  header: string;
}

export interface EventReportRow {
  id: string;
  circle: string;
  eventId: number;
  eventName: string;
  meterCount: number;
  eventCount: number;
  durationHhMm: string;
  slNo: number;
}

export interface EventReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Present on live responses when COUNT is exact. */
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface EventReportDataModel {
  columns: EventReportColumn[];
  rows: EventReportRow[];
  pagination: EventReportPagination;
}

export interface EventReportErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface EventReportResponse {
  success: boolean;
  data?: EventReportDataModel | null;
  message?: string;
  error?: EventReportErrorBody["error"];
}

export interface MappedEventReport {
  success: boolean;
  columns: EventReportColumn[];
  rows: EventReportRow[];
  pagination: EventReportPagination;
}

export type EventReportScenario =
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

const EMPTY_PAGINATION: EventReportPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  totalIsExact: null,
  hasMore: null,
};

export class EventReportMapper {
  static map(response: EventReportResponse): MappedEventReport {
    const data = response.data ?? ({} as EventReportDataModel);
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
