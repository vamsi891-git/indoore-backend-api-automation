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
    name: string;
    data: TrendPoint[];
}
export interface EventTransactionData {
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
export interface EventTransactionResponse {
    success: boolean;
    data: EventTransactionData;
}
export class EventTransactionMapper {
    static map(data: any): EventTransactionData {
        return {
            reportType:data?.reportType ?? "",
            period:data?.period ?? "",
            fromDate:data?.fromDate ?? "",
            toDate:data?.toDate ?? "",
            category:data?.category ?? "",
            label:data?.label ?? "",
            totalCount:Number(data?.totalCount) || 0,
            records:(data?.phases ?? data?.categories ?? []).map((x: any) => ({label:x?.label ?? "",
                            count:Number(  x?.count ) || 0,
                            percentage:x?.percentage ?? "0.00"
                        })
                    ),
            trend:data?.trend?.series?.map((series: any) => ({
                        name:series?.name ?? "",
                        data:series?.data?.map((point: any) => ({
                                    key:point?.key ?? "",
                                    label:point?.label ?? "",
                                    value:Number(point?.value) || 0
                                })
                            )
                            ?? []
                    })
                )
                ?? []
        };
    }
}