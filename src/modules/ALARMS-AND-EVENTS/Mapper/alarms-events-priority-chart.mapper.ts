export interface AlarmsEventsPriorityChartDataset {
  label: string;
  data: number[];
  meterCount: number[];
}

export interface AlarmsEventsPriorityChartPeriod {
  period: string;
  fromDate: string;
  toDate: string;
  totalCount: number;
  labels: string[];
  datasets: AlarmsEventsPriorityChartDataset[];
}

export interface AlarmsEventsPriorityChartData {
  priority: string;
  label: string;
  hourly: AlarmsEventsPriorityChartPeriod;
  daily: AlarmsEventsPriorityChartPeriod;
  weekly: AlarmsEventsPriorityChartPeriod;
  monthly: AlarmsEventsPriorityChartPeriod;
}

export interface AlarmsEventsPriorityChartResponse {
  success: boolean;
  data?: AlarmsEventsPriorityChartData;
  error?: { code?: string; message?: string };
}

function mapDataset(row: {
  label?: string;
  data?: number[];
  meterCount?: number[];
}): AlarmsEventsPriorityChartDataset {
  return {
    label: String(row?.label ?? ""),
    data: (row?.data ?? []).map((value) => Number(value ?? 0)),
    meterCount: (row?.meterCount ?? []).map((value) => Number(value ?? 0)),
  };
}

function mapPeriod(
  row: Partial<AlarmsEventsPriorityChartPeriod> | undefined,
  period: string,
): AlarmsEventsPriorityChartPeriod {
  return {
    period: String(row?.period ?? period),
    fromDate: String(row?.fromDate ?? ""),
    toDate: String(row?.toDate ?? ""),
    totalCount: Number(row?.totalCount ?? 0),
    labels: (row?.labels ?? []).map((label) => String(label ?? "")),
    datasets: (row?.datasets ?? []).map((dataset) => mapDataset(dataset)),
  };
}

export class AlarmsEventsPriorityChartMapper {
  static map(response: AlarmsEventsPriorityChartResponse): AlarmsEventsPriorityChartData {
    const data = response.data ?? ({} as AlarmsEventsPriorityChartData);
    return {
      priority: String(data.priority ?? ""),
      label: String(data.label ?? ""),
      hourly: mapPeriod(data.hourly, "hourly"),
      daily: mapPeriod(data.daily, "daily"),
      weekly: mapPeriod(data.weekly, "weekly"),
      monthly: mapPeriod(data.monthly, "monthly"),
    };
  }
}
