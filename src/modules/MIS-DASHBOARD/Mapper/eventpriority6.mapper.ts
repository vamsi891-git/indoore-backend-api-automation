export interface Phase {
  label: string;
  count: number;
  percentage: string;
}
export interface TrendPoint {
  key: string;
  label: string;
  value: number;
  meterCount: number;
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
  records: Phase[];
  trend: TrendSeries[];
}
export class EventPriorityMapper {
  static map(data: any): EventPriorityData {
    return {
      period: data?.period ?? "",
      fromDate: data?.fromDate ?? "",
      toDate: data?.toDate ?? "",
      priorityId: Number(data?.priorityId),
      label: String(data?.label ?? ""),
      totalCount: Number(data?.totalCount ?? 0),
      records: (data?.phases ?? []).map((row: any) => ({
        label: String(row?.label ?? ""),
        count: Number(row?.count ?? 0),
        percentage: String(row?.percentage ?? "0"),
      })),
      trend: (data?.trend?.series ?? []).map((series: any) => ({
        name: series?.name ?? "",
        data: (series?.data ?? []).map((point: any) => ({
          key: String(point?.key ?? ""),
          label: String(point?.label ?? ""),
          value: Number(point?.value ?? 0),
          meterCount: Number(point?.meterCount ?? 0),
        })),
      })),
    };
  }
}
