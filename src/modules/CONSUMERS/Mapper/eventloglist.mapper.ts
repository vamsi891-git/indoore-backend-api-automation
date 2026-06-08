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
    data: EventLogListData;
}

export class EventLogListMapper {
    static map(response: EventLogListResponse): EventLogListData & { success: boolean } {
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
