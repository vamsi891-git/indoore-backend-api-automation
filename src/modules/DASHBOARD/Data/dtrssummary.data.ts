import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrSummaryQuery } from "../Api/dtrsummary.api";
import type {
    DtrSummaryPeriod,
    DtrSummaryResponse,
    DtrSummaryScenario,
} from "../Mapper/dtrsummary.mapper";
import { dtrSummaryPeriodTrendLengths } from "../Mapper/dtrsummary.mapper";

export const dtrSummaryMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrSummaryDefaultPeriod: DtrSummaryPeriod = "daily";

const dtrSummarySuccessMessage =
    "DTR dashboard summary fetched successfully.";

function fillTrends(length: number, value: number): number[] {
    return Array.from({ length }, () => value);
}

function offTrends(length: number, offCount: number): number[] {
    return [...Array(length - 1).fill(0), offCount];
}

function buildLiveFleetContract(
    period: DtrSummaryPeriod,
): DtrSummaryResponse {
    const trendLength = dtrSummaryPeriodTrendLengths[period];
    return {
        success: true,
        data: {
            period,
            totalDtrs: {
                label: "Total DTRs",
                count: 1285,
                trends: fillTrends(trendLength, 1285),
            },
            dtrsOn: {
                label: "DTRs ON",
                count: 0,
                trends: fillTrends(trendLength, 0),
            },
            dtrsOff: {
                label: "DTRs OFF",
                count: 1285,
                trends: offTrends(trendLength, 1285),
            },
            activeAlerts: {
                label: "Active Alerts",
                count: 0,
                trends: fillTrends(trendLength, 0),
            },
        },
        message: dtrSummarySuccessMessage,
    };
}

/** Live sample from GET .../dtr/summary?period=hourly (10 Jul 2026) */
export const dtrSummaryContractLiveHourlyResponse =
    buildLiveFleetContract("hourly");

/** Live sample from GET .../dtr/summary?period=daily (10 Jul 2026) */
export const dtrSummaryContractLiveDailyResponse =
    buildLiveFleetContract("daily");

/** Live sample from GET .../dtr/summary?period=weekly (10 Jul 2026) */
export const dtrSummaryContractLiveWeeklyResponse =
    buildLiveFleetContract("weekly");

/** Live sample from GET .../dtr/summary?period=monthly (10 Jul 2026) */
export const dtrSummaryContractLiveMonthlyResponse =
    buildLiveFleetContract("monthly");

/** Live sample from GET .../dtr/summary?period=yearly (10 Jul 2026) */
export const dtrSummaryContractLiveYearlyResponse =
    buildLiveFleetContract("yearly");

export const dtrSummaryContractAllOffResponse: DtrSummaryResponse = {
    success: true,
    data: {
        period: "daily",
        totalDtrs: {
            label: "Total DTRs",
            count: 50,
            trends: fillTrends(12, 50),
        },
        dtrsOn: { label: "DTRs ON", count: 0, trends: fillTrends(12, 0) },
        dtrsOff: {
            label: "DTRs OFF",
            count: 50,
            trends: fillTrends(12, 50),
        },
        activeAlerts: {
            label: "Active Alerts",
            count: 0,
            trends: fillTrends(12, 0),
        },
    },
    message: dtrSummarySuccessMessage,
};

export interface DtrSummaryTestCase {
    testName: string;
    scenario: DtrSummaryScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function resolveDtrSummaryQuery(
    scenario: DtrSummaryScenario,
): DtrSummaryQuery {
    switch (scenario) {
        case "dev_period_hourly":
            return { period: "hourly" };
        case "dev_period_weekly":
            return { period: "weekly" };
        case "dev_period_monthly":
            return { period: "monthly" };
        case "dev_period_yearly":
            return { period: "yearly" };
        case "dev_ignore_unknown_query":
            return { period: dtrSummaryDefaultPeriod, foo: 1 };
        case "invalid_period":
            return { period: "invalid_period" };
        case "contract_live_hourly":
        case "contract_live_daily":
        case "contract_live_weekly":
        case "contract_live_monthly":
        case "contract_live_yearly":
        case "contract_all_off_scenario":
        case "dev_period_daily":
        default:
            return { period: dtrSummaryDefaultPeriod };
    }
}

export function resolveDtrSummaryExpectedPeriod(
    scenario: DtrSummaryScenario,
): DtrSummaryPeriod | undefined {
    const query = resolveDtrSummaryQuery(scenario);
    if (typeof query.period === "string") {
        return query.period as DtrSummaryPeriod;
    }
    return dtrSummaryDefaultPeriod;
}

export function resolveDtrSummaryContractBody(
    scenario: DtrSummaryScenario,
): DtrSummaryResponse | undefined {
    switch (scenario) {
        case "contract_live_hourly":
            return dtrSummaryContractLiveHourlyResponse;
        case "contract_live_daily":
            return dtrSummaryContractLiveDailyResponse;
        case "contract_live_weekly":
            return dtrSummaryContractLiveWeeklyResponse;
        case "contract_live_monthly":
            return dtrSummaryContractLiveMonthlyResponse;
        case "contract_live_yearly":
            return dtrSummaryContractLiveYearlyResponse;
        case "contract_all_off_scenario":
            return dtrSummaryContractAllOffResponse;
        default:
            return undefined;
    }
}

/** @deprecated */
export const DtrsSummaryData = {
    period: dtrSummaryDefaultPeriod,
};

export const dtrSummaryTestCases: DtrSummaryTestCase[] = [
    {
        testName:
            "Validate GET /indore/dashboard/dtr/summary — period=daily (live)",
        scenario: "dev_period_daily",
        tags: ["@smoke", "@dashboard", "@dtr-summary"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/summary — period=hourly",
        scenario: "dev_period_hourly",
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/summary — period=weekly",
        scenario: "dev_period_weekly",
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/summary — period=monthly",
        scenario: "dev_period_monthly",
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/summary — period=yearly",
        scenario: "dev_period_yearly",
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/summary — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Contract — hourly summary cards with 12-point trends (10 Jul 2026)",
        scenario: "contract_live_hourly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Contract — daily summary cards with 12-point trends (10 Jul 2026)",
        scenario: "contract_live_daily",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Contract — weekly summary cards with 8-point trends (10 Jul 2026)",
        scenario: "contract_live_weekly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Contract — monthly summary cards with 12-point trends (10 Jul 2026)",
        scenario: "contract_live_monthly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Contract — yearly summary cards with 12-point trends (10 Jul 2026)",
        scenario: "contract_live_yearly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName: "Contract — all DTRs OFF scenario",
        scenario: "contract_all_off_scenario",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-summary", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/summary — invalid period rejected",
        scenario: "invalid_period",
        expectedStatus: 400,
        tags: ["@dashboard", "@dtr-summary", "@negative"],
    },
];
