export interface MetricItem {
    count: number;
    percentage: string;
    label: string;
    trend?: {
        change: number;
        direction: string;
        comparisonLabel: string;
    };
    sparkline?: number[];
}
export interface DashboardMetricsModel {
    timestamp: string;
    totalMeterCount?: number;
    connectionStatus: Record<string, MetricItem>;
    categoryWiseConsumer: Record<string, MetricItem>;
    phaseWiseConsumer: Record<string, MetricItem>;
    oemWiseConsumer: Record<string, MetricItem>;
    consumerType: Record<string, MetricItem>;
    networkDetails: Record<string, MetricItem>;
}
export interface DashboardMetricsResponse {
    success: boolean;
    data: DashboardMetricsModel;
    message: string;
}
export class DashboardMetricsMapper {
    static mapData(data: any): DashboardMetricsModel {
        const {
            totalMeterCount,
            ...connectionStatus
        } = data.connectionStatus ?? {};
        return {
            timestamp: data.timestamp,
            totalMeterCount,
            connectionStatus,
            categoryWiseConsumer: data.categoryWiseConsumer ?? {},
            phaseWiseConsumer: data.phaseWiseConsumer ?? {},
            oemWiseConsumer: data.oemWiseConsumer ?? {},
            consumerType: data.consumerType ?? {},
            networkDetails: data.networkDetails ?? {}
        };
    }
}