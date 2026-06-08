export interface DashboardStat {
  count: number;
  percentage: number;
  label: string;
}

export interface DashboardData {
  timeStamp: string;
  totalMeterCount?: number;
  connectionStatus: Record<string, DashboardStat>;
  categoryWiseConsumer: Record<string, DashboardStat>;
  phaseWiseConsumer: Record<string, DashboardStat>;
  oemWiseConsumer: Record<string, DashboardStat>;
  consumerType: Record<string, DashboardStat>;
  networkDetails: Record<string, DashboardStat>;
}

export interface DashboardMetricsResponse {
  success: boolean;
  data: DashboardData;
  message: string;
}

interface MetricItemInput {
  count: number;
  percentage: number | string;
  label: string;
}

export class DashboardMetricsMapper {
  private static isMetricItem(value: unknown): value is MetricItemInput {
    return (
      typeof value === "object" &&
      value !== null &&
      "count" in value &&
      "label" in value
    );
  }

  private static normalize(
    section: Record<string, unknown> = {},
  ): Record<string, DashboardStat> {
    return Object.fromEntries(
      Object.entries(section)
        .filter((entry): entry is [string, MetricItemInput] =>
          DashboardMetricsMapper.isMetricItem(entry[1]),
        )
        .map(([key, value]) => [
          key,
          {
            count: Number(value.count),
            percentage: Number(value.percentage),
            label: value.label,
          },
        ]),
    );
  }

  static mapData(data: Record<string, unknown>): DashboardData {
    const connectionStatus = (data.connectionStatus ?? {}) as Record<
      string,
      unknown
    >;
    const { totalMeterCount, ...connectionMetrics } = connectionStatus;

    return {
      timeStamp: String(data.timestamp ?? ""),
      totalMeterCount:
        typeof totalMeterCount === "number"
          ? totalMeterCount
          : Number(totalMeterCount) || undefined,
      connectionStatus: this.normalize(connectionMetrics),
      phaseWiseConsumer: this.normalize(
        data.phaseWiseConsumer as Record<string, unknown>,
      ),
      categoryWiseConsumer: this.normalize(
        data.categoryWiseConsumer as Record<string, unknown>,
      ),
      oemWiseConsumer: this.normalize(
        data.oemWiseConsumer as Record<string, unknown>,
      ),
      consumerType: this.normalize(
        data.consumerType as Record<string, unknown>,
      ),
      networkDetails: this.normalize(
        data.networkDetails as Record<string, unknown>,
      ),
    };
  }
}
