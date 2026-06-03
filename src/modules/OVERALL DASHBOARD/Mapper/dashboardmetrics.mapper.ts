export interface DashboardStat {
  count: number;
  percentage: number;
  label: string;
}
export interface DashboardData {
  timeStamp: string;
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
export class DashboardMetricsMapper {
  private static normalize(section: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(section).map(([key, value]) => [
        key,
        {
          count: Number(value.count),
          percentage: Number(value.percentage),
          label: value.label,
        },
      ]),
    );
  }
  static mapData(data:any):DashboardData {
    return {
        timeStamp:data.timestamp,
        connectionStatus:this.normalize(data.connectionStatus),
        phaseWiseConsumer:this.normalize(data.phaseWiseConsumer),
        categoryWiseConsumer:this.normalize(data.categoryWiseConsumer),
        oemWiseConsumer:this.normalize(data.oemWiseConsumer),
        consumerType:this.normalize(data.consumerType),
        networkDetails:this.normalize(data.networkDetails)
    };
  }
}
