export interface AlarmsEventsCategoryWiseRow {
  category: string;
  label: string;
  totalCount: number;
  count: number;
  previousCount: number;
}

export interface AlarmsEventsCategoryWiseData {
  currentDate: string;
  previousDate: string;
  totalEvents: number;
  totalEventsPreviousDay: number;
  categories: AlarmsEventsCategoryWiseRow[];
}

export interface AlarmsEventsCategoryWiseResponse {
  success: boolean;
  data?: AlarmsEventsCategoryWiseData;
  error?: { code?: string; message?: string };
}

export class AlarmsEventsCategoryWiseMapper {
  static map(response: AlarmsEventsCategoryWiseResponse): AlarmsEventsCategoryWiseData {
    const data = response.data ?? ({} as AlarmsEventsCategoryWiseData);
    return {
      currentDate: String(data.currentDate ?? ""),
      previousDate: String(data.previousDate ?? ""),
      totalEvents: Number(data.totalEvents ?? 0),
      totalEventsPreviousDay: Number(data.totalEventsPreviousDay ?? 0),
      categories: (data.categories ?? []).map((row) => ({
        category: String(row.category ?? ""),
        label: String(row.label ?? ""),
        totalCount: Number(row.totalCount ?? 0),
        count: Number(row.count ?? 0),
        previousCount: Number(row.previousCount ?? 0),
      })),
    };
  }
}
