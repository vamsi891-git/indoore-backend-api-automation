export type DtrEventsScenario =
    | "dev_by_code_primary"
    | "dev_by_code_alt"
    | "dev_page_two"
    | "dev_custom_limit"
    | "dev_ignore_unknown_query"
    | "dev_with_search_query"
    | "contract_empty_page"
    | "contract_resolved_row"
    | "contract_pending_row"
    | "contract_pagination_page_two"
    | "dtr_not_found"
    | "empty_dtr_code"
    | "invalid_page";

export type DtrEventStatus = "Resolved" | "Pending";

export interface DtrEventRow {
    serialNo: number;
    meterSlNo: string | null;
    eventDateTime: string;
    restoredDateTime: string | null;
    description: string | null;
    duration: string | null;
    status: DtrEventStatus;
}

export interface DtrEventsData {
    rows: DtrEventRow[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface DtrEventsResponse {
    success: boolean;
    data?: DtrEventsData | null;
}

export interface DtrEventsErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: {
            formErrors?: string[];
            fieldErrors?: Record<string, string[]>;
        };
    };
}

export interface MappedDtrEvents extends DtrEventsData {
    success: boolean;
}

const EMPTY_EVENTS: DtrEventsData = {
    rows: [],
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
};

export class DtrEventsMapper {
    static map(response: DtrEventsResponse): MappedDtrEvents {
        const data = response.data ?? EMPTY_EVENTS;
        return {
            success: response.success,
            rows: data.rows ?? [],
            page: data.page ?? 1,
            pageSize: data.pageSize ?? 20,
            totalCount: data.totalCount ?? 0,
            totalPages: data.totalPages ?? 0,
        };
    }
}
