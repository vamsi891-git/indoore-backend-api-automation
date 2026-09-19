export interface AlarmsEventsCategoryChartBucket {
  meterCount: number;
  percentage: number;
}

export interface AlarmsEventsCategoryChartPeriod {
  period: string;
  totalMeterCount: number;
  categories: Record<string, AlarmsEventsCategoryChartBucket>;
}

export interface AlarmsEventsCategoryChartData {
  category: string;
  label: string;
  hourly: AlarmsEventsCategoryChartPeriod;
  daily: AlarmsEventsCategoryChartPeriod;
  weekly: AlarmsEventsCategoryChartPeriod;
  monthly: AlarmsEventsCategoryChartPeriod;
}

export interface AlarmsEventsCategoryChartResponse {
  success: boolean;
  data?: AlarmsEventsCategoryChartData;
  error?: { code?: string; message?: string };
}

function mapBucket(row: any): AlarmsEventsCategoryChartBucket {
  return {
    meterCount: Number(row?.meterCount ?? 0),
    percentage: Number(row?.percentage ?? 0),
  };
}

function mapPeriod(row: any, period: string): AlarmsEventsCategoryChartPeriod {
  const categories: Record<string, AlarmsEventsCategoryChartBucket> = {};
  const source = row?.categories ?? {};
  for (const key of Object.keys(source)) {
    categories[key] = mapBucket(source[key]);
  }
  return {
    period: String(row?.period ?? period),
    totalMeterCount: Number(row?.totalMeterCount ?? 0),
    categories,
  };
}

export class AlarmsEventsCategoryChartMapper {
  static map(
    response: AlarmsEventsCategoryChartResponse,
  ): AlarmsEventsCategoryChartData {
    const data = response.data ?? ({} as AlarmsEventsCategoryChartData);
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
