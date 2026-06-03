export interface MonthlyNetMeterItem {
    slNo: number;
    circle: string;
    division: string;
    subDivision: string;
    zone: string;
    feeder: string;
    dtr: string;
    name: string;
    address: string | null;
    ivrsNumber: string;
    category: string | null;
    msn: string;
    phase: string;
    subStation: string;
    kwh: number | null;
    kvah: number | null;
    kwhExport: number | null;
    kvahExport: number | null;
    netKwh: number | null;
    netKvah: number | null;
}
export interface MonthlyNetMeterResponse {
    success: boolean;
    data: {
        items: MonthlyNetMeterItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export class MonthlyNetMeterMapper {
    static map(response: MonthlyNetMeterResponse) {
        return {
            items: response.data.items,
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit,
            totalPages: response.data.totalPages
        };
    }
}