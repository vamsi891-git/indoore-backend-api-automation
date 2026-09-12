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

/** Live sample from GET /indore/dashboard/consumer/metrics (13 Aug 2026 05:21 UTC). */
export const dashboardMetricsContractLiveFullResponse: DashboardMetricsResponse =
    {
        success: true,
        data: {
            timestamp: "2026-08-13T05:21:27.437Z",
            connectionStatus: {
                totalMeterCount: 133137,
                cd: {
                    count: 128239,
                    percentage: "96.32",
                    label: "Connected",
                },
                td: {
                    count: 4846,
                    percentage: "3.64",
                    label: "Disconnected",
                },
                pd: {
                    count: 52,
                    percentage: "0.04",
                    label: "Permanently Disconnected",
                },
            },
            categoryWiseConsumer: {
                commercial: {
                    count: 32273,
                    percentage: "24.24",
                    label: "Commercial",
                },
                electricVehicleChargingStation: {
                    count: 45,
                    percentage: "0.03",
                    label: "Electric Vehicle Charging Station",
                },
                industrial: {
                    count: 3793,
                    percentage: "2.85",
                    label: "Industrial",
                },
                residential: {
                    count: 95863,
                    percentage: "72.00",
                    label: "Residential",
                },
                streetLight: {
                    count: 8,
                    percentage: "0.01",
                    label: "Street Light",
                },
                temporary: {
                    count: 1155,
                    percentage: "0.87",
                    label: "Temporary",
                },
            },
            phaseWiseConsumer: {
                "1ph": {
                    count: 115346,
                    percentage: "86.64",
                    label: "1 PH",
                },
                "3 ph wc": {
                    count: 13954,
                    percentage: "10.48",
                    label: "3 PH WC",
                },
                "3 ph ct": {
                    count: 411,
                    percentage: "0.31",
                    label: "3 PH 4 CT",
                },
                ht: {
                    count: 3426,
                    percentage: "2.57",
                    label: "HT",
                },
            },
            oemWiseConsumer: {
                kavika: {
                    count: 1,
                    percentage: "0.00",
                    label: "KAVIKA",
                },
                elSewedy: {
                    count: 3,
                    percentage: "0.00",
                    label: "El Sewedy",
                },
                "Linkwell Telesystems": {
                    count: 9221,
                    percentage: "6.93",
                    label: "Linkwell Telesystems",
                },
                technofabs: {
                    count: 1,
                    percentage: "0.00",
                    label: "TECHNOFABS",
                },
                "L&T": {
                    count: 123911,
                    percentage: "93.07",
                    label: "L&T",
                },
            },
            consumerType: {
                totalConsumers: {
                    count: 133137,
                    percentage: "100.00",
                    label: "Total Consumers",
                    trends: [
                        133059, 133099, 133140, 133154, 133154, 133173, 133173,
                        133194, 133201, 133223, 133223, 133223, 133289, 133326,
                        133366, 133379, 133379, 133379, 133379, 133383, 133386,
                        133386, 133388, 133388, 133388, 133388, 133388, 133388,
                        133395, 133137,
                    ],
                },
                prepaid: {
                    count: 329,
                    percentage: "0.25",
                    label: "Prepaid Connections",
                    trends: [
                        10, 50, 91, 105, 105, 124, 124, 145, 152, 174, 174, 174,
                        224, 261, 301, 314, 314, 314, 314, 318, 321, 321, 322, 322,
                        322, 322, 322, 322, 329, 329,
                    ],
                    paymentContractTblRefId: 1,
                },
                postpaid: {
                    count: 132808,
                    percentage: "99.60",
                    label: "Postpaid Connections",
                    trends: [
                        133049, 133049, 133049, 133049, 133049, 133049, 133049,
                        133049, 133049, 133049, 133049, 133049, 133065, 133065,
                        133065, 133065, 133065, 133065, 133065, 133065, 133065,
                        133065, 133066, 133066, 133066, 133066, 133066, 133066,
                        133066, 132808,
                    ],
                    paymentContractTblRefId: 2,
                },
                netMeter: {
                    count: 199,
                    percentage: "0.15",
                    label: "Net Metering Consumers",
                    trends: [
                        199, 199, 199, 199, 199, 199, 199, 199, 199, 199, 199,
                        199, 199, 199, 199, 199, 199, 199, 199, 199, 199, 199,
                        199, 199, 199, 199, 199, 199, 199, 199,
                    ],
                },
            },
            networkDetails: {
                substations: {
                    count: 26,
                    percentage: "0.42",
                    label: "Substations",
                    trends: [
                        26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
                        26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
                    ],
                },
                feeders: {
                    count: 1161,
                    percentage: "18.59",
                    label: "Feeders",
                    trends: [
                        1161, 1161, 1161, 1161, 1161, 1161, 1161, 1161, 1161,
                        1161, 1161, 1161, 1161, 1161, 1161, 1161, 1161, 1161,
                        1161, 1161, 1161, 1161, 1161, 1161,
                    ],
                },
                dtrs: {
                    count: 5059,
                    percentage: "81.00",
                    label: "Distribution Transformers (DTRs)",
                    trends: [
                        4797, 4797, 4797, 4797, 4797, 4797, 4797, 4797, 4797,
                        4797, 4797, 4797, 4797, 4797, 4797, 4797, 4797, 4797,
                        4797, 4797, 4797, 4803, 5033, 5059,
                    ],
                },
                consumers: {
                    count: 133137,
                    percentage: "100.00",
                    label: "Active Consumers",
                    trends: [
                        128900, 128900, 128902, 128903, 128910, 129296, 130040,
                        130428, 130805, 131252, 131769, 131771, 132056, 132169,
                        132247, 132360, 132863, 133052, 133052, 133052, 133052,
                        133052, 133379, 133137,
                    ],
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
            timestamp: "2026-08-13T05:21:27.437Z",
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
            timestamp: "2026-08-13T05:21:27.437Z",
            connectionStatus: { totalMeterCount: 133137 },
            categoryWiseConsumer: {},
            phaseWiseConsumer: {},
            oemWiseConsumer: {},
            consumerType: {
                totalConsumers: {
                    count: 133137,
                    percentage: "100.00",
                    label: "Total Consumers",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        133137,
                    ),
                },
                prepaid: {
                    count: 329,
                    percentage: "0.25",
                    label: "Prepaid Connections",
                    trends: trailingTrend(
                        dashboardMetricsConsumerTrendLength,
                        329,
                    ),
                    paymentContractTblRefId: 1,
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
            timestamp: "2026-08-13T05:21:27.437Z",
            connectionStatus: { totalMeterCount: 133137 },
            categoryWiseConsumer: {},
            phaseWiseConsumer: {},
            oemWiseConsumer: {},
            consumerType: {},
            networkDetails: {
                substations: {
                    count: 26,
                    percentage: "0.42",
                    label: "Substations",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        26,
                    ),
                },
                feeders: {
                    count: 1161,
                    percentage: "18.59",
                    label: "Feeders",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        1161,
                    ),
                },
                dtrs: {
                    count: 5059,
                    percentage: "81.00",
                    label: "Distribution Transformers (DTRs)",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        5059,
                    ),
                },
                consumers: {
                    count: 133137,
                    percentage: "100.00",
                    label: "Active Consumers",
                    trends: trailingTrend(
                        dashboardMetricsNetworkTrendLength,
                        133137,
                    ),
                },
            },
        },
        message: dashboardMetricsSuccessMessage,
    };

export interface DashboardMetricsTestCase {
    testName: string;
    scenario: DashboardMetricsScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function resolveDashboardMetricsQuery(
    scenario: DashboardMetricsScenario,
): DashboardMetricsQuery {
    switch (scenario) {
        case "dev_ignore_unknown_query":
            return { foo: "bar" };
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
        testName: "Dashboard overview — counts and cards load",
        scenario: "dev_live_primary",
        tags: ["@smoke", "@dashboard", "@metrics"],
    },
    {
        testName: "Dashboard overview — extra unused filters are ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName: "Saved example — full overview numbers (13 Aug 2026)",
        scenario: "contract_live_full",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName: "Saved example — connection status buckets sum to ~100% (live 13 Aug 2026)",
        scenario: "contract_connection_status",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName: "Saved example — consumerType 30-day trends with trailing live count",
        scenario: "contract_consumer_type_trends",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
    {
        testName: "Saved example — networkDetails 24-month trends with trailing live count",
        scenario: "contract_network_details_trends",
        isContractFixture: true,
        tags: ["@dashboard", "@metrics", "@edge"],
    },
];
