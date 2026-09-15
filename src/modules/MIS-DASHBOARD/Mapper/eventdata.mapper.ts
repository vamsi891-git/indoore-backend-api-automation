export interface ClassificationRow {
  category: string;
  label: string;
  currentDay: number;
  previousDay: number;
}
export interface DayCompare {
  currentDay: number;
  previousDay: number;
}
export interface PriorityRow {
  priorityId: number;
  label: string;
  currentDay: number;
  previousDay: number;
}
export interface EventDataSummary {
  reportType: string;
  currentDate: string;
  previousDate: string;
  totalEventsCurrentDay: number;
  totalEventsPreviousDay: number;
  classifications: ClassificationRow[];
  active: DayCompare;
  resolve: DayCompare;
  priorities: PriorityRow[];
}
export class EventDataMapper {
  static map(data: any): EventDataSummary {
    return {
      reportType: String(data?.reportType ?? ""),
      currentDate: String(data?.currentDate ?? ""),
      previousDate: String(data?.previousDate ?? ""),
      totalEventsCurrentDay: Number(data?.totalEventsCurrentDay ?? 0),
      totalEventsPreviousDay: Number(data?.totalEventsPreviousDay ?? 0),
      classifications: (data?.classifications ?? []).map((row: any) => ({
        category: String(row?.category ?? ""),
        label: String(row?.label ?? ""),
        currentDay: Number(row?.currentDay ?? 0),
        previousDay: Number(row?.previousDay ?? 0),
      })),
      active: {
        currentDay: Number(data?.active?.currentDay ?? 0),
        previousDay: Number(data?.active?.previousDay ?? 0),
      },
      resolve: {
        currentDay: Number(data?.resolve?.currentDay ?? 0),
        previousDay: Number(data?.resolve?.previousDay ?? 0),
      },
      priorities: (data?.priorities ?? []).map((row: any) => ({
        priorityId: Number(row?.priorityId),
        label: String(row?.label ?? ""),
        currentDay: Number(row?.currentDay ?? 0),
        previousDay: Number(row?.previousDay ?? 0),
      })),
    };
  }
}
