import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrVoltageUnbalanceQuery } from "../Api/dtrvoltageunbalance.api";
import type {
    DtrVoltageUnbalanceResponse,
    DtrVoltageUnbalanceScenario,
} from "../Mapper/dtrvoltageunbalance.mapper";

export const dtrVoltageUnbalanceMaxResponseTimeMs =
    MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrVoltageUnbalanceSuccessMessage =
    "DTR voltage unbalance distribution fetched successfully.";

export {
    dtrUnbalanceUnauthorizedMessage as dtrVoltageUnbalanceUnauthorizedMessage,
    dtrUnbalanceAccessTokenInvalidMessage as dtrVoltageUnbalanceAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Live sample from GET /indore/dashboard/dtr/voltage-unbalance (13 Jul 2026). */
export const dtrVoltageUnbalanceContractAllZeroResponse: DtrVoltageUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 0, percentage: 0 },
                { label: "Moderate", value: 0, percentage: 0 },
                { label: "Balanced", value: 0, percentage: 0 },
            ],
        },
        message: dtrVoltageUnbalanceSuccessMessage,
    };

/** Contract — mixed fleet distribution with percentages summing to 100. */
export const dtrVoltageUnbalanceContractMixedResponse: DtrVoltageUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 10, percentage: 10 },
                { label: "Moderate", value: 30, percentage: 30 },
                { label: "Balanced", value: 60, percentage: 60 },
            ],
        },
        message: dtrVoltageUnbalanceSuccessMessage,
    };

/** Contract — all DTRs balanced. */
export const dtrVoltageUnbalanceContractAllBalancedResponse: DtrVoltageUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 0, percentage: 0 },
                { label: "Moderate", value: 0, percentage: 0 },
                { label: "Balanced", value: 100, percentage: 100 },
            ],
        },
        message: dtrVoltageUnbalanceSuccessMessage,
    };

/** Contract — all DTRs severe unbalance. */
export const dtrVoltageUnbalanceContractAllSevereResponse: DtrVoltageUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 50, percentage: 100 },
                { label: "Moderate", value: 0, percentage: 0 },
                { label: "Balanced", value: 0, percentage: 0 },
            ],
        },
        message: dtrVoltageUnbalanceSuccessMessage,
    };

/** Contract — rounded percentages still consistent with values. */
export const dtrVoltageUnbalanceContractPercentageConsistencyResponse: DtrVoltageUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 1, percentage: 33.33 },
                { label: "Moderate", value: 1, percentage: 33.33 },
                { label: "Balanced", value: 1, percentage: 33.34 },
            ],
        },
        message: dtrVoltageUnbalanceSuccessMessage,
    };

export interface DtrVoltageUnbalanceTestCase {
    testName: string;
    scenario: DtrVoltageUnbalanceScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function resolveDtrVoltageUnbalanceQuery(
    scenario: DtrVoltageUnbalanceScenario,
): DtrVoltageUnbalanceQuery {
    switch (scenario) {
        case "dev_ignore_unknown_query":
            return { foo: "bar", period: "daily" };
        default:
            return {};
    }
}

export function resolveDtrVoltageUnbalanceContractBody(
    scenario: DtrVoltageUnbalanceScenario,
): DtrVoltageUnbalanceResponse | null {
    switch (scenario) {
        case "contract_all_zero":
            return dtrVoltageUnbalanceContractAllZeroResponse;
        case "contract_mixed_distribution":
            return dtrVoltageUnbalanceContractMixedResponse;
        case "contract_all_balanced":
            return dtrVoltageUnbalanceContractAllBalancedResponse;
        case "contract_all_severe":
            return dtrVoltageUnbalanceContractAllSevereResponse;
        case "contract_percentage_consistency":
            return dtrVoltageUnbalanceContractPercentageConsistencyResponse;
        default:
            return null;
    }
}

export const dtrVoltageUnbalanceTestCases: DtrVoltageUnbalanceTestCase[] = [
    {
        testName:
            "Validate GET /indore/dashboard/dtr/voltage-unbalance — live distribution",
        scenario: "dev_live_primary",
        tags: ["@smoke", "@dashboard", "@dtr-voltage-unbalance"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/voltage-unbalance — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    },
    {
        testName:
            "Contract — all-zero Severe/Moderate/Balanced distribution (13 Jul 2026)",
        scenario: "contract_all_zero",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    },
    {
        testName: "Contract — mixed Severe/Moderate/Balanced distribution",
        scenario: "contract_mixed_distribution",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    },
    {
        testName: "Contract — all DTRs Balanced",
        scenario: "contract_all_balanced",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    },
    {
        testName: "Contract — all DTRs Severe",
        scenario: "contract_all_severe",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    },
    {
        testName: "Contract — percentage consistency with rounding",
        scenario: "contract_percentage_consistency",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    },
];
