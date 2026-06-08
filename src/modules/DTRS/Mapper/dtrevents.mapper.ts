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
    data: DtrEventsData;
}

export class DtrEventsMapper {
    static map(
        response: DtrEventsResponse,
    ): DtrEventsData & { success: boolean } {
        const data = response.data ?? ({} as DtrEventsData);
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
