export interface AlarmsEventsCategoryDrillColumn {
  key: string;
  header: string;
}

export interface AlarmsEventsCategoryDrillRow {
  id: string;
  eventId: number;
  eventName: string;
  eventClassificationName: string;
  meterCount: number;
  eventCount: number;
  duration: string;
  circleId: number;
  circleName: string;
}

export interface AlarmsEventsCategoryDrillData {
  columns: AlarmsEventsCategoryDrillColumn[];
  rows: AlarmsEventsCategoryDrillRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  context: {
    view: string;
    groupBy: string;
    fromDate: string;
    toDate: string;
    date: string;
    series: string;
    hierarchyLevel: string;
    category: string;
  };
  totals: {
    totalMeterCount: number;
    totalEventCount: number;
    totalRows: number;
  };
}

export interface AlarmsEventsCategoryDrillResponse {
  success: boolean;
  data?: AlarmsEventsCategoryDrillData;
  error?: { code?: string; message?: string };
}

export class AlarmsEventsCategoryDrillMapper {
  static map(response: AlarmsEventsCategoryDrillResponse): AlarmsEventsCategoryDrillData {
    const data = response.data ?? ({} as AlarmsEventsCategoryDrillData);
    return {
      columns: (data.columns ?? []).map((col) => ({
        key: String(col.key ?? ""),
        header: String(col.header ?? ""),
      })),
      rows: (data.rows ?? []).map((row) => ({
        id: String(row.id ?? ""),
        eventId: Number(row.eventId ?? 0),
        eventName: String(row.eventName ?? ""),
        eventClassificationName: String(row.eventClassificationName ?? ""),
        meterCount: Number(row.meterCount ?? 0),
        eventCount: Number(row.eventCount ?? 0),
        duration: String(row.duration ?? ""),
        circleId: Number(row.circleId ?? 0),
        circleName: String(row.circleName ?? ""),
      })),
      pagination: {
        page: Number(data.pagination?.page ?? 0),
        limit: Number(data.pagination?.limit ?? 0),
        total: Number(data.pagination?.total ?? 0),
        totalPages: Number(data.pagination?.totalPages ?? 0),
      },
      context: {
        view: String(data.context?.view ?? ""),
        groupBy: String(data.context?.groupBy ?? ""),
        fromDate: String(data.context?.fromDate ?? ""),
        toDate: String(data.context?.toDate ?? ""),
        date: String(data.context?.date ?? ""),
        series: String(data.context?.series ?? ""),
        hierarchyLevel: String(data.context?.hierarchyLevel ?? ""),
        category: String(data.context?.category ?? ""),
      },
      totals: {
        totalMeterCount: Number(data.totals?.totalMeterCount ?? 0),
        totalEventCount: Number(data.totals?.totalEventCount ?? 0),
        totalRows: Number(data.totals?.totalRows ?? 0),
      },
    };
  }
}
