export type FeederAlertStatus = "Active" | "Resolved";

export interface FeederAlertRow {
    serialNo: number;
    eventType: string | null;
    meterNumber: string | null;
    occurredOn: string;
    duration: string | null;
    status: FeederAlertStatus;
}

export interface FeederAlertsData {
    rows: FeederAlertRow[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface FeederAlertsResponse {
    success: boolean;
    data: FeederAlertsData;
}

export class FeederAlertsMapper {
    static map(
        response: FeederAlertsResponse,
    ): FeederAlertsData & { success: boolean } {
        const data = response.data ?? ({} as FeederAlertsData);
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
