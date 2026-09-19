export interface AlarmsEventsPriorityWiseStatus {
  totalCount: number;
  currentDay: number;
  previousDay: number;
}

export interface AlarmsEventsPriorityWiseRow {
  priorityId: number;
  label: string;
  totalCount: number;
  count: number;
  previousCount: number;
}

export interface AlarmsEventsPriorityWiseData {
  currentDate: string;
  previousDate: string;
  totalEvents: number;
  totalEventsPreviousDay: number;
  active: AlarmsEventsPriorityWiseStatus;
  resolve: AlarmsEventsPriorityWiseStatus;
  priorities: AlarmsEventsPriorityWiseRow[];
}

export interface AlarmsEventsPriorityWiseResponse {
  success: boolean;
  data?: AlarmsEventsPriorityWiseData;
  error?: { code?: string; message?: string };
}

function mapStatus(
  status?: Partial<AlarmsEventsPriorityWiseStatus>,
): AlarmsEventsPriorityWiseStatus {
  return {
    totalCount: Number(status?.totalCount ?? 0),
    currentDay: Number(status?.currentDay ?? 0),
    previousDay: Number(status?.previousDay ?? 0),
  };
}

export class AlarmsEventsPriorityWiseMapper {
  static map(
    response: AlarmsEventsPriorityWiseResponse,
  ): AlarmsEventsPriorityWiseData {
    const data = response.data ?? ({} as AlarmsEventsPriorityWiseData);
    return {
      currentDate: String(data.currentDate ?? ""),
      previousDate: String(data.previousDate ?? ""),
      totalEvents: Number(data.totalEvents ?? 0),
      totalEventsPreviousDay: Number(data.totalEventsPreviousDay ?? 0),
      active: mapStatus(data.active),
      resolve: mapStatus(data.resolve),
      priorities: (data.priorities ?? []).map((row) => ({
        priorityId: Number(row.priorityId ?? 0),
        label: String(row.label ?? ""),
        totalCount: Number(row.totalCount ?? 0),
        count: Number(row.count ?? 0),
        previousCount: Number(row.previousCount ?? 0),
      })),
    };
  }
}
