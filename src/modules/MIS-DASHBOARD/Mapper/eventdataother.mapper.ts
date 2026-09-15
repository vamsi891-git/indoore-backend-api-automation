export interface OtherRecord {
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
export interface EventOtherData {
  reportType: string;
  period: string;
  fromDate: string;
  toDate: string;
  category: string;
  label: string;
  totalCount: number;
  records: OtherRecord[];
  trend: TrendSeries[];
}
export class EventOtherMapper {
  static map(data: any): EventOtherData {
    return {
      reportType: data.reportType,
      period: data.period,
      fromDate: data.fromDate,
      toDate: data.toDate,
      category: data.category,
      label: data.label,
      totalCount: Number(data.totalCount),
      records: data.phases ?? data.categories ?? [],
      trend: (data.trend?.series ?? []).map((series: any) => ({
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
