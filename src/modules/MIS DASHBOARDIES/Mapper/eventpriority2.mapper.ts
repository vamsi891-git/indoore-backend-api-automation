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
export interface EventPriorityData {
    period: string;
    fromDate: string;
    toDate: string;
    priorityId: number;
    label: string;
    totalCount: number;
    records: RecordItem[];
    trend: TrendSeries[];
}
export class EventPriorityMapper {
    static map(data: any): EventPriorityData {
        return {
            period:data?.period ?? "",
            fromDate:data?.fromDate ?? "",
            toDate:data?.toDate ?? "",
            priorityId:Number(data?.priorityId) || 0,
            label:data?.label ?? "",
            totalCount:Number(data?.totalCount) || 0,
            records:data?.phases?.map((x: any) => ({
                        label:x?.label ?? "",
                        count:Number(x?.count) || 0,
                        percentage:x?.percentage ?? "0"
                    })
                )
                ?? [],
            trend:
                data?.trend?.series?.map((series: any) => ({
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