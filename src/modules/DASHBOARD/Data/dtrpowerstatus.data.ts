import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrPowerStatusQuery } from "../Api/dtrpowerstatus.api";
import type {
    DtrPowerStatusPeriod,
    DtrPowerStatusResponse,
    DtrPowerStatusScenario,
    PowerPoint,
} from "../Mapper/dtrpowerstatus.mapper";
import { dtrPowerStatusPeriodPointCounts } from "../Mapper/dtrpowerstatus.mapper";

export const dtrPowerStatusMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrPowerStatusDefaultPeriod: DtrPowerStatusPeriod = "daily";

const dtrPowerStatusSuccessMessage =
    "DTR power status chart fetched successfully.";

function nullPoint(label: string): PowerPoint {
    return {
        label,
        dtrsOn: 0,
        dtrsOff: 0,
        onPercentage: 0,
        offPercentage: 0,
    };
}

function nullPeriodContract(
    period: DtrPowerStatusPeriod,
    labels: string[],
): DtrPowerStatusResponse {
    return {
        success: true,
        data: {
            period,
            points: labels.map(nullPoint),
        },
        message: dtrPowerStatusSuccessMessage,
    };
}

const hourlyLabels = [
    "23:00",
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
];

const dailyLabels = [
    "29 Jun",
    "30 Jun",
    "1 Jul",
    "2 Jul",
    "3 Jul",
    "4 Jul",
    "5 Jul",
    "6 Jul",
    "7 Jul",
    "8 Jul",
    "9 Jul",
    "10 Jul",
];

const weeklyLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

/** Live sample from GET .../power-status?period=hourly (10 Jul 2026) */
export const dtrPowerStatusContractNullHourlyResponse = nullPeriodContract(
    "hourly",
    hourlyLabels,
);

/** Live sample from GET .../power-status?period=daily (10 Jul 2026) */
export const dtrPowerStatusContractNullDailyResponse = nullPeriodContract(
    "daily",
    dailyLabels,
);

/** Live sample from GET .../power-status?period=weekly (10 Jul 2026) */
export const dtrPowerStatusContractNullWeeklyResponse = nullPeriodContract(
    "weekly",
    weeklyLabels,
);

/** Live sample from GET .../power-status?period=monthly (10 Jul 2026) */
export const dtrPowerStatusContractLiveMonthlyResponse: DtrPowerStatusResponse =
    {
        success: true,
        data: {
            period: "monthly",
            points: [
                {
                    label: "Aug 2025",
                    dtrsOn: 1086,
                    dtrsOff: 199,
                    onPercentage: 84.5,
                    offPercentage: 15.5,
                },
                {
                    label: "Sep 2025",
                    dtrsOn: 1078,
                    dtrsOff: 207,
                    onPercentage: 83.9,
                    offPercentage: 16.1,
                },
                {
                    label: "Oct 2025",
                    dtrsOn: 1106,
                    dtrsOff: 179,
                    onPercentage: 86.1,
                    offPercentage: 13.9,
                },
                {
                    label: "Nov 2025",
                    dtrsOn: 983,
                    dtrsOff: 302,
                    onPercentage: 76.5,
                    offPercentage: 23.5,
                },
                {
                    label: "Dec 2025",
                    dtrsOn: 726,
                    dtrsOff: 559,
                    onPercentage: 56.5,
                    offPercentage: 43.5,
                },
                ...[
                    "Jan 2026",
                    "Feb 2026",
                    "Mar 2026",
                    "Apr 2026",
                    "May 2026",
                    "Jun 2026",
                ].map((label) => nullPoint(label)),
                {
                    label: "Jul 2026",
                    dtrsOn: 0,
                    dtrsOff: 1285,
                    onPercentage: 0,
                    offPercentage: 100,
                },
            ],
        },
        message: dtrPowerStatusSuccessMessage,
    };

/** Live sample from GET .../power-status?period=yearly (10 Jul 2026) */
export const dtrPowerStatusContractLiveYearlyResponse: DtrPowerStatusResponse =
    {
        success: true,
        data: {
            period: "yearly",
            points: [
                ...[
                    "2015",
                    "2016",
                    "2017",
                    "2018",
                    "2019",
                    "2020",
                    "2021",
                    "2022",
                    "2023",
                    "2024",
                ].map((label) => nullPoint(label)),
                {
                    label: "2025",
                    dtrsOn: 431,
                    dtrsOff: 854,
                    onPercentage: 33.5,
                    offPercentage: 66.5,
                },
                {
                    label: "2026",
                    dtrsOn: 0,
                    dtrsOff: 1285,
                    onPercentage: 0,
                    offPercentage: 100,
                },
            ],
        },
        message: dtrPowerStatusSuccessMessage,
    };

export const dtrPowerStatusContractMixedResponse: DtrPowerStatusResponse = {
    success: true,
    data: {
        period: "daily",
        points: [
            {
                label: "1 Jul",
                dtrsOn: 800,
                dtrsOff: 485,
                onPercentage: 62,
                offPercentage: 38,
            },
            {
                label: "2 Jul",
                dtrsOn: 0,
                dtrsOff: 1285,
                onPercentage: 0,
                offPercentage: 100,
            },
        ],
    },
    message: dtrPowerStatusSuccessMessage,
};

export interface DtrPowerStatusTestCase {
    testName: string;
    scenario: DtrPowerStatusScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function resolveDtrPowerStatusQuery(
    scenario: DtrPowerStatusScenario,
): DtrPowerStatusQuery {
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
            return { period: dtrPowerStatusDefaultPeriod, foo: 1 };
        case "invalid_period":
            return { period: "invalid_period" };
        case "contract_null_hourly":
        case "contract_null_daily":
        case "contract_null_weekly":
        case "contract_live_monthly":
        case "contract_live_yearly":
        case "contract_on_off_mixed":
        case "dev_period_daily":
        default:
            return { period: dtrPowerStatusDefaultPeriod };
    }
}

export function resolveDtrPowerStatusExpectedPeriod(
    scenario: DtrPowerStatusScenario,
): DtrPowerStatusPeriod | undefined {
    const query = resolveDtrPowerStatusQuery(scenario);
    if (typeof query.period === "string") {
        return query.period as DtrPowerStatusPeriod;
    }
    return dtrPowerStatusDefaultPeriod;
}

export function resolveDtrPowerStatusContractBody(
    scenario: DtrPowerStatusScenario,
): DtrPowerStatusResponse | undefined {
    switch (scenario) {
        case "contract_null_hourly":
            return dtrPowerStatusContractNullHourlyResponse;
        case "contract_null_daily":
            return dtrPowerStatusContractNullDailyResponse;
        case "contract_null_weekly":
            return dtrPowerStatusContractNullWeeklyResponse;
        case "contract_live_monthly":
            return dtrPowerStatusContractLiveMonthlyResponse;
        case "contract_live_yearly":
            return dtrPowerStatusContractLiveYearlyResponse;
        case "contract_on_off_mixed":
            return dtrPowerStatusContractMixedResponse;
        default:
            return undefined;
    }
}

/** @deprecated */
export const DtrPowerStatusData = {
    expectedDayCount: dtrPowerStatusPeriodPointCounts.daily,
    expectedMonthCount: dtrPowerStatusPeriodPointCounts.monthly,
    maxPercentage: 100,
};

export const dtrPowerStatusTestCases: DtrPowerStatusTestCase[] = [
    {
        testName:
            "Validate GET /indore/dashboard/dtr/power-status — period=daily (live)",
        scenario: "dev_period_daily",
        tags: ["@smoke", "@dashboard", "@dtr-power-status"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/power-status — period=hourly",
        scenario: "dev_period_hourly",
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/power-status — period=weekly",
        scenario: "dev_period_weekly",
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/power-status — period=monthly",
        scenario: "dev_period_monthly",
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/power-status — period=yearly",
        scenario: "dev_period_yearly",
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/power-status — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Contract — hourly null on/off buckets (10 Jul 2026)",
        scenario: "contract_null_hourly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Contract — daily null on/off buckets (10 Jul 2026)",
        scenario: "contract_null_daily",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Contract — weekly null on/off buckets (10 Jul 2026)",
        scenario: "contract_null_weekly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Contract — monthly populated on/off buckets (10 Jul 2026)",
        scenario: "contract_live_monthly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Contract — yearly populated on/off buckets (10 Jul 2026)",
        scenario: "contract_live_yearly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName: "Contract — mixed on/off percentages",
        scenario: "contract_on_off_mixed",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/power-status — invalid period rejected",
        scenario: "invalid_period",
        expectedStatus: 400,
        tags: ["@dashboard", "@dtr-power-status", "@negative"],
    },
];
