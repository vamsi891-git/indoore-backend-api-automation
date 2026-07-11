export type DashboardMetricsScenario =
    | "dev_live_primary"
    | "dev_ignore_unknown_query"
    | "contract_live_full"
    | "contract_connection_status"
    | "contract_consumer_type_trends"
    | "contract_network_details_trends";

export interface MetricTrend {
    change: number;
    direction: string;
    comparisonLabel: string;
}

export interface MetricItem {
    count: number;
    percentage: number;
    label: string;
    trend?: MetricTrend;
    sparkline?: number[];
    trends?: number[];
}

/** Raw API metric shape — percentages may be strings before mapper normalization. */
export interface MetricItemInput {
    count: number;
    percentage: number | string;
    label: string;
    trend?: MetricTrend;
    sparkline?: number[];
    trends?: number[];
}

export interface ConnectionStatusInput {
    totalMeterCount?: number;
    [key: string]: MetricItemInput | number | undefined;
}

export interface DashboardMetricsDataModel {
    timestamp: string;
    connectionStatus: ConnectionStatusInput;
    categoryWiseConsumer: Record<string, MetricItemInput>;
    phaseWiseConsumer: Record<string, MetricItemInput>;
    oemWiseConsumer: Record<string, MetricItemInput>;
    consumerType: Record<string, MetricItemInput>;
    networkDetails: Record<string, MetricItemInput>;
}

export interface DashboardMetricsResponse {
    success: boolean;
    data?: DashboardMetricsDataModel | null;
    message?: string;
}

export interface MappedDashboardMetrics {
    success: boolean;
    timestamp: string;
    totalMeterCount?: number;
    connectionStatus: Record<string, MetricItem>;
    categoryWiseConsumer: Record<string, MetricItem>;
    phaseWiseConsumer: Record<string, MetricItem>;
    oemWiseConsumer: Record<string, MetricItem>;
    consumerType: Record<string, MetricItem>;
    networkDetails: Record<string, MetricItem>;
}

function isMetricItem(value: unknown): value is MetricItemInput {
    return (
        typeof value === "object" &&
        value !== null &&
        "count" in value &&
        "label" in value
    );
}

function normalizeSection(
    section: Record<string, unknown> = {},
): Record<string, MetricItem> {
    return Object.fromEntries(
        Object.entries(section)
            .filter((entry): entry is [string, MetricItemInput] =>
                isMetricItem(entry[1]),
            )
            .map(([key, value]) => [
                key,
                {
                    count: Number(value.count),
                    percentage: Number(value.percentage),
                    label: value.label,
                    ...(value.trend ? { trend: value.trend } : {}),
                    ...(value.sparkline ? { sparkline: value.sparkline } : {}),
                    ...(value.trends ? { trends: value.trends } : {}),
                },
            ]),
    );
}

export class DashboardMetricsMapper {
    static map(response: DashboardMetricsResponse): MappedDashboardMetrics {
        const data = response.data ?? ({} as DashboardMetricsDataModel);
        const connectionStatus = (data.connectionStatus ?? {}) as Record<
            string,
            unknown
        >;
        const { totalMeterCount, ...connectionMetrics } = connectionStatus;

        return {
            success: response.success,
            timestamp: String(data.timestamp ?? ""),
            totalMeterCount:
                typeof totalMeterCount === "number"
                    ? totalMeterCount
                    : Number(totalMeterCount) || undefined,
            connectionStatus: normalizeSection(connectionMetrics),
            categoryWiseConsumer: normalizeSection(
                data.categoryWiseConsumer as Record<string, unknown>,
            ),
            phaseWiseConsumer: normalizeSection(
                data.phaseWiseConsumer as Record<string, unknown>,
            ),
            oemWiseConsumer: normalizeSection(
                data.oemWiseConsumer as Record<string, unknown>,
            ),
            consumerType: normalizeSection(
                data.consumerType as Record<string, MetricItemInput>,
            ),
            networkDetails: normalizeSection(
                data.networkDetails as Record<string, unknown>,
            ),
        };
    }
}
