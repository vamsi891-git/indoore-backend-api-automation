import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DashboardMetricsQuery } from "../Api/dashboardmetrics.api";
import type {
    DashboardMetricsResponse,
    DashboardMetricsScenario,
} from "../Mapper/dashboardmetrics.mapper";

export const dashboardMetricsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dashboardMetricsSuccessMessage =
    "Dashboard data fetched successfully";

/** `consumerType` widget — 30 IST calendar days (oldest → newest). */
export const dashboardMetricsConsumerTrendLength = 30;

/** `networkDetails` widget — 24 IST calendar months (oldest → newest). */
export const dashboardMetricsNetworkTrendLength = 24;

export const dashboardMetricsSparklineLength = 7;

export const dashboardMetricsMetricGroups = [
    "connectionStatus",
    "categoryWiseConsumer",
    "phaseWiseConsumer",
    "oemWiseConsumer",
    "consumerType",
    "networkDetails",
] as const;

function trailingTrend(length: number, value: number): number[] {
    return Array.from({ length: length - 1 }, () => 0).concat(value);
}

/** Live sample from GET /indore/dashboard/metrics (10 Jul 2026 05:38 UTC). */
export const dashboardMetricsContractLiveFullResponse: DashboardMetricsResponse =
    {
        success: true,
        data: {
            timestamp: "2026-07-10T05:38:00.364Z",
            connectionStatus: {
                totalMeterCount: 132808,
                cd: {
                    count: 127910,
                    percentage: "96.31",
                    label: "Connected",
                },
                td: {
                    count: 4846,
                    percentage: "3.65",
                    label: "Disconnected",
                },
                pd: {
                    count: 52,
                    percentage: "0.04",
                    label: "Permanently Disconnected",
                },
                inactive: {
                    count: 0,
                    percentage: "0.00",
                    label: "Inactive Consumers",
                },
            },
            categoryWiseConsumer: {
                industrial: {
                    count: 3793,
                    percentage: "2.86",
                    label: "Industrial",
                },
                bhagyaJyothi: {
                    count: 9949,
                    percentage: "7.49",
                    label: "Bhagya Jyothi",
                },
                temporary: {
                    count: 1155,
                    percentage: "0.87",
                    label: "Temporary",
                },
                commercial: {
                    count: 22097,
                    percentage: "16.64",
                    label: "Commercial",
                },
                streetLight: {
                    count: 8,
                    percentage: "0.01",
                    label: "Street Light",
                },
                residential: {
                    count: 95806,
                    percentage: "72.14",
                    label: "Residential",
                },
            },
            phaseWiseConsumer: {
                "1ph": {
                    count: 115034,
                    percentage: "86.62",
                    label: "1 PH",
                },
                "3 ph wc": {
                    count: 13954,
                    percentage: "10.51",
                    label: "3 PH WC",
                },
                "3 ph ct": {
                    count: 394,
                    percentage: "0.30",
                    label: "3 PH 4 CT",
                },
                ht: {
                    count: 3426,
                    percentage: "2.58",
                    label: "HT",
                },
            },
            oemWiseConsumer: {
                elSewedy: {
                    count: 1,
                    percentage: "0.00",
                    label: "El Sewedy",
                },
                "Linkwell Telesystems": {
                    count: 8982,
                    percentage: "6.76",
                    label: "Linkwell Telesystems",
                },
                "L&T": {
                    count: 123825,
                    percentage: "93.24",
                    label: "L&T",
                },
            },
            consumerType: {
                totalConsumers: {
                    count: 132808,
                    percentage: "100.00",
                    label: "Total Consumers",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        132808,
                    ),
                },
                prepaid: {
                    count: 16,
                    percentage: "0.01",
                    label: "Prepaid Connections",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        16,
                    ),
                },
                postpaid: {
                    count: 132792,
                    percentage: "99.84",
                    label: "Postpaid Connections",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        132792,
                    ),
                },
                netMeter: {
                    count: 200,
                    percentage: "0.15",
                    label: "Net Metering Consumers",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        200,
                    ),
                },
            },
            networkDetails: {
                substations: {
                    count: 26,
                    percentage: "0.40",
                    label: "Substations",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        26,
                    ),
                },
                feeders: {
                    count: 1161,
                    percentage: "17.95",
                    label: "Feeders",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        1161,
                    ),
                },
                dtrs: {
                    count: 5281,
                    percentage: "81.65",
                    label: "Distribution Transformers (DTRs)",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        5281,
                    ),
                },
                consumers: {
                    count: 132808,
                    percentage: "100.00",
                    label: "Active Consumers",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        132808,
                    ),
                },
            },
        },
        message: dashboardMetricsSuccessMessage,
    };

/** Connection-status slice from live sample. */
export const dashboardMetricsContractConnectionResponse: DashboardMetricsResponse =
    {
        success: true,
        data: {
            timestamp: "2026-07-10T05:38:00.364Z",
            connectionStatus:
                dashboardMetricsContractLiveFullResponse.data!
                    .connectionStatus,
            categoryWiseConsumer: {},
            phaseWiseConsumer: {},
            oemWiseConsumer: {},
            consumerType: {},
            networkDetails: {},
        },
        message: dashboardMetricsSuccessMessage,
    };

export const dashboardMetricsContractConsumerTrendsResponse: DashboardMetricsResponse =
    {
        success: true,
        data: {
            timestamp: "2026-07-10T05:38:00.364Z",
            connectionStatus: { totalMeterCount: 132808 },
            categoryWiseConsumer: {},
            phaseWiseConsumer: {},
            oemWiseConsumer: {},
            consumerType: {
                totalConsumers: {
                    count: 132808,
                    percentage: "100.00",
                    label: "Total Consumers",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        132808,
                    ),
                },
                prepaid: {
                    count: 16,
                    percentage: "0.01",
                    label: "Prepaid Connections",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        16,
                    ),
                },
            },
            networkDetails: {},
        },
        message: dashboardMetricsSuccessMessage,
    };

export const dashboardMetricsContractNetworkTrendsResponse: DashboardMetricsResponse =
    {
        success: true,
        data: {
            timestamp: "2026-07-10T05:38:00.364Z",
            connectionStatus: { totalMeterCount: 132808 },
            categoryWiseConsumer: {},
            phaseWiseConsumer: {},
            oemWiseConsumer: {},
            consumerType: {},
            networkDetails: {
                substations: {
                    count: 26,
                    percentage: "0.40",
                    label: "Substations",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        26,
                    ),
                },
                feeders: {
                    count: 1161,
                    percentage: "17.95",
                    label: "Feeders",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        1161,
                    ),
                },
                dtrs: {
                    count: 5281,
                    percentage: "81.65",
                    label: "Distribution Transformers (DTRs)",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        5281,
                    ),
                },
                consumers: {
                    count: 132808,
                    percentage: "100.00",
                    label: "Active Consumers",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        132808,
                    ),
                },
            },
        },
        message: dashboardMetricsSuccessMessage,
    };

export interface DashboardMetricsTestCase {
    testName: string;
    scenario: DashboardMetricsScenario;
    tags: string[];
    isContractFixture?: boolean;
}

export function resolveDashboardMetricsQuery(
    scenario: DashboardMetricsScenario,
): DashboardMetricsQuery {
    switch (scenario) {
        case "dev_ignore_unknown_query":
            return { foo: 1, bar: "baz" };
        default:
            return {};
    }
}

export function resolveDashboardMetricsContractBody(
    scenario: DashboardMetricsScenario,
): DashboardMetricsResponse | undefined {
    switch (scenario) {
        case "contract_live_full":
            return dashboardMetricsContractLiveFullResponse;
        case "contract_connection_status":
            return dashboardMetricsContractConnectionResponse;
        case "contract_consumer_type_trends":
            return dashboardMetricsContractConsumerTrendsResponse;
        case "contract_network_details_trends":
            return dashboardMetricsContractNetworkTrendsResponse;
        default:
            return undefined;
    }
}

/** @deprecated */
export const DashboardMetricsData = {
    sparklineLength: dashboardMetricsSparklineLength,
    maxPercentage: 100,
    minPercentage: 0,
};

export const dashboardMetricsTestCases: DashboardMetricsTestCase[] = [
    {
        testName:
            "Validate GET /indore/dashboard/metrics — live overview metrics",
        scenario: "dev_live_primary",
        tags: ["@smoke", "@dashboard", "@metrics"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/metrics — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName:
            "Contract — full live overview metrics (10 Jul 2026)",
        scenario: "contract_live_full",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName:
            "Contract — connection status buckets sum to ~100% (live 10 Jul 2026)",
        scenario: "contract_connection_status",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName:
            "Contract — consumerType 30-day trends with trailing live count",
        scenario: "contract_consumer_type_trends",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName:
            "Contract — networkDetails 24-month trends with trailing live count",
        scenario: "contract_network_details_trends",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
];
