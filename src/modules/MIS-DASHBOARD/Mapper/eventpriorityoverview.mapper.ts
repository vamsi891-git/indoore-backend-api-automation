export interface DayCompare {
  currentDay: number;
  previousDay: number;
}
export interface Priority {
  priorityId: number;
  label: string;
  currentDay: number;
  previousDay: number;
}
export interface EventPriorityOverviewData {
  currentDate: string;
  previousDate: string;
  totalEventsCurrentDay: number;
  totalEventsPreviousDay: number;
  active: DayCompare;
  resolve: DayCompare;
  priorities: Priority[];
}
export class EventPriorityOverviewMapper {
  static map(data: any): EventPriorityOverviewData {
    return {
      currentDate: data?.currentDate ?? "",
      previousDate: data?.previousDate ?? "",
      totalEventsCurrentDay: Number(data?.totalEventsCurrentDay ?? 0),
      totalEventsPreviousDay: Number(data?.totalEventsPreviousDay ?? 0),
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
