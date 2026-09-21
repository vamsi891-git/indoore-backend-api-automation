export interface AlarmsEventsChartPhase {
  meterCount: number;
  percentage: number;
}

export interface AlarmsEventsChartPeriod {
  period: string;
  totalMeterCount: number;
  phases: Record<string, AlarmsEventsChartPhase>;
}

export interface AlarmsEventsChartData {
  category: string;
  label: string;
  hourly: AlarmsEventsChartPeriod;
  daily: AlarmsEventsChartPeriod;
  weekly: AlarmsEventsChartPeriod;
  monthly: AlarmsEventsChartPeriod;
}

export interface AlarmsEventsChartResponse {
  success: boolean;
  data?: AlarmsEventsChartData;
  error?: { code?: string; message?: string };
}
function mapPhase(row: any): AlarmsEventsChartPhase {
  return {
    meterCount: Number(row?.meterCount ?? 0),
    percentage: Number(row?.percentage ?? 0),
  };
}
function mapPeriod(row: any, period: string): AlarmsEventsChartPeriod {
  const phases: Record<string, AlarmsEventsChartPhase> = {};
  const source = row?.phases ?? {};
  for (const key of Object.keys(source)) {
    phases[key] = mapPhase(source[key]);
  }
  return {
    period: String(row?.period ?? period),
    totalMeterCount: Number(row?.totalMeterCount ?? 0),
    phases,
  };
}
export class AlarmsEventsChartMapper {
  static map(response: AlarmsEventsChartResponse): AlarmsEventsChartData {
    const data = response.data ?? ({} as AlarmsEventsChartData);
    return {
      category: String(data.category ?? ""),
      label: String(data.label ?? ""),
      hourly: mapPeriod(data.hourly, "hourly"),
      daily: mapPeriod(data.daily, "daily"),
      weekly: mapPeriod(data.weekly, "weekly"),
      monthly: mapPeriod(data.monthly, "monthly"),
    };
  }
}
