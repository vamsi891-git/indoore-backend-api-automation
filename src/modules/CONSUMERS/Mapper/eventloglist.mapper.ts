export type EventLogStatus = "Resolved" | "Pending";

export interface EventLogRow {
  serialNo: number;
  meterNo: string | null;
  occurDateTime: string;
  restoreDateTime: string | null;
  description: string | null;
  durationDisplay: string | null;
  status: EventLogStatus;
}

export interface EventLogListData {
  rows: EventLogRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface EventLogListResponse {
  success: boolean;
  data?: EventLogListData | null;
}

export interface EventLogListErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export type EventLogListScenario =
  | "ell_by_ivrs"
  | "ell_by_account"
  | "ell_by_meter"
  | "ell_page_2"
  | "ell_with_search"
  | "ell_ignore_unknown_query"
  | "contract_empty_list"
  | "contract_pagination"
  | "contract_resolved_pending_rows"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref";

export interface MappedEventLogList {
  success: boolean;
  rows: EventLogRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export class EventLogListMapper {
  static map(response: EventLogListResponse): MappedEventLogList {
    const data = response.data ?? ({} as EventLogListData);
    return {
      success: response.success,
      rows: data.rows ?? [],
      page: data.page ?? 1,
      pageSize: data.pageSize ?? 10,
      totalCount: data.totalCount ?? 0,
      totalPages: data.totalPages ?? 0,
    };
  }
}
