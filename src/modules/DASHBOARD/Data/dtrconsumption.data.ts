import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrConsumptionQuery } from "../Api/dtrconsumption.api";
import type {
    ConsumptionPoint,
    DtrConsumptionPeriod,
    DtrConsumptionResponse,
    DtrConsumptionScenario,
} from "../Mapper/dtrconsumption.mapper";
import { dtrConsumptionPeriodPointCounts } from "../Mapper/dtrconsumption.mapper";

export const dtrConsumptionMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrConsumptionDefaultPeriod: DtrConsumptionPeriod = "daily";

const dtrConsumptionSuccessMessage =
    "DTR consumption data fetched successfully.";

function nullPoint(label: string): ConsumptionPoint {
    return { label, kwh: 0, kvah: 0, kvarh: 0 };
}

function nullPeriodContract(
    period: DtrConsumptionPeriod,
    labels: string[],
): DtrConsumptionResponse {
    return {
        success: true,
        data: {
            period,
            points: labels.map(nullPoint),
        },
        message: dtrConsumptionSuccessMessage,
    };
}

const hourlyLabels = [
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
    "11:00",
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

const monthlyLabels = [
    "Aug 2025",
    "Sept 2025",
    "Oct 2025",
    "Nov 2025",
    "Dec 2025",
    "Jan 2026",
    "Feb 2026",
    "Mar 2026",
    "Apr 2026",
    "May 2026",
    "Jun 2026",
    "Jul 2026",
];

const yearlyLabels = [
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
    "2025",
    "2026",
];

/** Live sample from GET .../consumption?period=hourly (10 Jul 2026) */
export const dtrConsumptionContractNullHourlyResponse = nullPeriodContract(
    "hourly",
    hourlyLabels,
);

/** Live sample from GET .../consumption?period=daily (10 Jul 2026) */
export const dtrConsumptionContractNullDailyResponse = nullPeriodContract(
    "daily",
    dailyLabels,
);

/** Live sample from GET .../consumption?period=weekly (10 Jul 2026) */
export const dtrConsumptionContractNullWeeklyResponse = nullPeriodContract(
    "weekly",
    weeklyLabels,
);

/** Live sample from GET .../consumption?period=monthly (10 Jul 2026) */
export const dtrConsumptionContractNullMonthlyResponse = nullPeriodContract(
    "monthly",
    monthlyLabels,
);

/** Live sample from GET .../consumption?period=yearly (10 Jul 2026) */
export const dtrConsumptionContractNullYearlyResponse = nullPeriodContract(
    "yearly",
    yearlyLabels,
);

export const dtrConsumptionContractPopulatedResponse: DtrConsumptionResponse =
    {
        success: true,
        data: {
            period: "daily",
            points: [
                { label: "1 Jul", kwh: 150.5, kvah: 180.2, kvarh: 95.1 },
                { label: "2 Jul", kwh: 200, kvah: 250, kvarh: 120 },
            ],
        },
        message: dtrConsumptionSuccessMessage,
    };

export interface DtrConsumptionTestCase {
    testName: string;
    scenario: DtrConsumptionScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function resolveDtrConsumptionQuery(
    scenario: DtrConsumptionScenario,
): DtrConsumptionQuery {
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
            return { period: dtrConsumptionDefaultPeriod, foo: 1 };
        case "invalid_period":
            return { period: "invalid_period" };
        case "contract_null_hourly":
        case "contract_null_daily":
        case "contract_null_weekly":
        case "contract_null_monthly":
        case "contract_null_yearly":
        case "contract_populated_points":
        case "dev_period_daily":
        default:
            return { period: dtrConsumptionDefaultPeriod };
    }
}

export function resolveDtrConsumptionExpectedPeriod(
    scenario: DtrConsumptionScenario,
): DtrConsumptionPeriod | undefined {
    const query = resolveDtrConsumptionQuery(scenario);
    if (typeof query.period === "string") {
        return query.period as DtrConsumptionPeriod;
    }
    return dtrConsumptionDefaultPeriod;
}

export function resolveDtrConsumptionContractBody(
    scenario: DtrConsumptionScenario,
): DtrConsumptionResponse | undefined {
    switch (scenario) {
        case "contract_null_hourly":
            return dtrConsumptionContractNullHourlyResponse;
        case "contract_null_daily":
            return dtrConsumptionContractNullDailyResponse;
        case "contract_null_weekly":
            return dtrConsumptionContractNullWeeklyResponse;
        case "contract_null_monthly":
            return dtrConsumptionContractNullMonthlyResponse;
        case "contract_null_yearly":
            return dtrConsumptionContractNullYearlyResponse;
        case "contract_populated_points":
            return dtrConsumptionContractPopulatedResponse;
        default:
            return undefined;
    }
}

/** @deprecated */
export const DtrConsumptionData = {
    expectedDays: dtrConsumptionPeriodPointCounts.daily,
    expectedMonths: dtrConsumptionPeriodPointCounts.monthly,
    minValue: 0,
};

export const dtrConsumptionTestCases: DtrConsumptionTestCase[] = [
    {
        testName:
            "Validate GET /indore/dashboard/dtr/consumption — period=daily (live)",
        scenario: "dev_period_daily",
        tags: ["@smoke", "@dashboard", "@dtr-consumption"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/consumption — period=hourly",
        scenario: "dev_period_hourly",
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/consumption — period=weekly",
        scenario: "dev_period_weekly",
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/consumption — period=monthly",
        scenario: "dev_period_monthly",
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/consumption — period=yearly",
        scenario: "dev_period_yearly",
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/consumption — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Contract — hourly null energy buckets (10 Jul 2026)",
        scenario: "contract_null_hourly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Contract — daily null energy buckets (10 Jul 2026)",
        scenario: "contract_null_daily",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Contract — weekly null energy buckets (10 Jul 2026)",
        scenario: "contract_null_weekly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Contract — monthly null energy buckets (10 Jul 2026)",
        scenario: "contract_null_monthly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Contract — yearly null energy buckets (10 Jul 2026)",
        scenario: "contract_null_yearly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName: "Contract — populated kWh/kVAh/kVArh points",
        scenario: "contract_populated_points",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/consumption — invalid period rejected",
        scenario: "invalid_period",
        expectedStatus: 400,
        tags: ["@dashboard", "@dtr-consumption", "@negative"],
    },
];
