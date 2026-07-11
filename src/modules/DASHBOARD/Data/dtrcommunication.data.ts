import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrCommunicationQuery } from "../Api/dtrcommunication.api";
import type {
    DtrCommunicationPeriod,
    DtrCommunicationResponse,
    DtrCommunicationScenario,
} from "../Mapper/dtrcommunication.mapper";

export const dtrCommunicationMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrCommunicationDefaultPeriod: DtrCommunicationPeriod = "daily";

const dtrCommunicationSuccessMessage =
    "DTR communication status fetched successfully.";

function nullPoints(labels: string[]) {
    return labels.map((label) => ({
        label,
        communicating: 0,
        nonCommunicating: 0,
    }));
}

function nullPeriodContract(
    period: DtrCommunicationPeriod,
    labels: string[],
): DtrCommunicationResponse {
    return {
        success: true,
        data: {
            period,
            points: nullPoints(labels),
        },
        message: dtrCommunicationSuccessMessage,
    };
}

/** Live sample from GET .../communication-status?period=hourly (10 Jul 2026) */
export const dtrCommunicationContractNullHourlyResponse =
    nullPeriodContract("hourly", [
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
    ]);

/** Live sample from GET .../communication-status?period=daily (10 Jul 2026) */
export const dtrCommunicationContractNullDailyResponse = nullPeriodContract(
    "daily",
    [
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
    ],
);

/** Live sample from GET .../communication-status?period=weekly (10 Jul 2026) */
export const dtrCommunicationContractNullWeeklyResponse =
    nullPeriodContract("weekly", [
        "W1",
        "W2",
        "W3",
        "W4",
        "W5",
        "W6",
        "W7",
        "W8",
    ]);

/** Live sample from GET .../communication-status?period=monthly (10 Jul 2026) */
export const dtrCommunicationContractNullMonthlyResponse =
    nullPeriodContract("monthly", [
        "Aug 2025",
        "Sep 2025",
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
    ]);

/** Live sample from GET .../communication-status?period=yearly (10 Jul 2026) */
export const dtrCommunicationContractNullYearlyResponse =
    nullPeriodContract("yearly", [
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
    ]);

export const dtrCommunicationContractPopulatedResponse: DtrCommunicationResponse =
    {
        success: true,
        data: {
            period: "daily",
            points: [
                { label: "1 Jul", communicating: 1200, nonCommunicating: 85 },
                { label: "2 Jul", communicating: 1180, nonCommunicating: 105 },
            ],
        },
    };

export interface DtrCommunicationTestCase {
    testName: string;
    scenario: DtrCommunicationScenario;
    expectedStatus?: number;
    tags: string[];
    isContractFixture?: boolean;
}

export function resolveDtrCommunicationQuery(
    scenario: DtrCommunicationScenario,
): DtrCommunicationQuery {
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
            return { period: dtrCommunicationDefaultPeriod, foo: 1 };
        case "invalid_period":
            return { period: "invalid_period" };
        case "contract_null_hourly":
        case "contract_null_daily":
        case "contract_null_weekly":
        case "contract_null_monthly":
        case "contract_null_yearly":
        case "contract_populated_daily":
        case "dev_period_daily":
        default:
            return { period: dtrCommunicationDefaultPeriod };
    }
}

export function resolveDtrCommunicationExpectedPeriod(
    scenario: DtrCommunicationScenario,
): DtrCommunicationPeriod | undefined {
    const query = resolveDtrCommunicationQuery(scenario);
    if (typeof query.period === "string") {
        return query.period as DtrCommunicationPeriod;
    }
    return dtrCommunicationDefaultPeriod;
}

export function resolveDtrCommunicationContractBody(
    scenario: DtrCommunicationScenario,
): DtrCommunicationResponse | undefined {
    switch (scenario) {
        case "contract_null_hourly":
            return dtrCommunicationContractNullHourlyResponse;
        case "contract_null_daily":
            return dtrCommunicationContractNullDailyResponse;
        case "contract_null_weekly":
            return dtrCommunicationContractNullWeeklyResponse;
        case "contract_null_monthly":
            return dtrCommunicationContractNullMonthlyResponse;
        case "contract_null_yearly":
            return dtrCommunicationContractNullYearlyResponse;
        case "contract_populated_daily":
            return dtrCommunicationContractPopulatedResponse;
        default:
            return undefined;
    }
}

/** @deprecated */
export const DtrCommunicationData = {
    page: 1,
    limit: 20,
};

export const dtrCommunicationTestCases: DtrCommunicationTestCase[] = [
    {
        testName:
            "Validate GET /indore/dashboard/dtr/communication-status — period=hourly (live)",
        scenario: "dev_period_hourly",
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/communication-status — period=daily (live)",
        scenario: "dev_period_daily",
        tags: ["@smoke", "@dashboard", "@dtr-communication"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/communication-status — period=weekly",
        scenario: "dev_period_weekly",
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/communication-status — period=monthly",
        scenario: "dev_period_monthly",
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/communication-status — period=yearly",
        scenario: "dev_period_yearly",
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/communication-status — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Contract — hourly null communicating/non-communicating buckets (10 Jul 2026)",
        scenario: "contract_null_hourly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Contract — daily null communicating/non-communicating buckets (10 Jul 2026)",
        scenario: "contract_null_daily",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Contract — weekly null communicating/non-communicating buckets (10 Jul 2026)",
        scenario: "contract_null_weekly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Contract — monthly null communicating/non-communicating buckets (10 Jul 2026)",
        scenario: "contract_null_monthly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Contract — yearly null communicating/non-communicating buckets (10 Jul 2026)",
        scenario: "contract_null_yearly",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName: "Contract — populated communicating/non-communicating points",
        scenario: "contract_populated_daily",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-communication", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/communication-status — invalid period rejected",
        scenario: "invalid_period",
        expectedStatus: 400,
        tags: ["@dashboard", "@dtr-communication", "@negative"],
    },
];
