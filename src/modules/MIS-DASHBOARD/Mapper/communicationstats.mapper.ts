export interface MeterStat {
    value: number;
    previous: number;
}
export interface CommStatsData {
    fromDate: string;
    toDate: string;
    referenceDate: string;
    totalMeters: MeterStat;
    activeMeters: MeterStat;
    nonOperationalMeters:MeterStat;
    unmappedMeters:MeterStat;
}
export interface CommStatsResponse {
    success: boolean;
    data: CommStatsData;
}
export class CommStatsMapper {static mapCommStats(data: any): CommStatsData {
        return {
            fromDate:data?.fromDate ?? "",
            toDate:data?.toDate ?? "",
            referenceDate:data?.referenceDate ?? "",
            totalMeters:data?.totalMeters ?? {  value: 0,  previous: 0 },
            activeMeters:data?.activeMeters ?? { value: 0, previous: 0},
            nonOperationalMeters:data?.nonOperationalMeters ?? { value: 0, previous: 0},
            unmappedMeters:data?.unmappedMeters ?? {  value: 0,  previous: 0  }
        };
    }
}