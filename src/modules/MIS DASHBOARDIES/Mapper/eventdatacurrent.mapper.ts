export interface RecordItem {
    label: string;
    count: number;
    percentage: string;
}
export interface TrendPoint {
    key: string;
    label: string;
    value: number;
}
export interface TrendSeries {
    name: string
    data: TrendPoint[];
}
export interface EventCurrentData {
    reportType: string;
    period: string;
    fromDate: string;
    toDate: string;
    category: string;
    label: string;
    totalCount: number;
    records: RecordItem[];
    trend: TrendSeries[];
}
export class EventCurrentMapper {
    static map(data: any): EventCurrentData {
        return {
            reportType:data.reportType,
            period:data.period,
            fromDate:data.fromDate,
            toDate:data.toDate,
            category:data.category,
            label:data.label,
            totalCount:Number(data.totalCount),
            records:data.phases??data.categories??[],
            trend:data.trend?.series??[]
        };
    }
}