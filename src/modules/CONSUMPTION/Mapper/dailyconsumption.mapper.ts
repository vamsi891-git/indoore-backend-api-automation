export interface DailyConsumptionItem {
    slNo: number;
    division: string | null;
    zone: string | null;
    subStation: string | null;
    feeder: string | null;
    dtr: string | null;
    name: string | null;
    ivrsNumber: string | null;
    msn: string | null;
    phase: string | null;
    serviceDate: string | null;
    minDate: string | null;
    maxDate: string | null;
    ir: number | null;
    fr: number | null;
    kwh: number | null;
}
export interface DailyConsumptionData {
    items: DailyConsumptionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface DailyConsumptionResponse {
    success: boolean;
    data?: DailyConsumptionData;
}
export class DailyConsumptionMapper {
    static map(response: DailyConsumptionResponse,): DailyConsumptionData & { success: boolean } {
        const data = response.data ?? ({} as DailyConsumptionData);
        return {
            success: response.success,
            items: data.items ?? [],
            total: data.total ?? 0,
            page: data.page ?? 1,
            limit: data.limit ?? 30,
            totalPages: data.totalPages ?? 0,
        };
    }
}
