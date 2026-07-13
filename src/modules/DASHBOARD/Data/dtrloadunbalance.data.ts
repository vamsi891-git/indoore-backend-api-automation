import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrLoadUnbalanceQuery } from "../Api/dtrloadunbalance.api";
import type {
    DtrLoadUnbalanceResponse,
    DtrLoadUnbalanceScenario,
} from "../Mapper/dtrloadunbalance.mapper";

export const dtrLoadUnbalanceMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrLoadUnbalanceSuccessMessage =
    "DTR load unbalance distribution fetched successfully.";

export {
    dtrUnbalanceUnauthorizedMessage as dtrLoadUnbalanceUnauthorizedMessage,
    dtrUnbalanceAccessTokenInvalidMessage as dtrLoadUnbalanceAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Live sample from GET /indore/dashboard/dtr/load-unbalance (13 Jul 2026). */
export const dtrLoadUnbalanceContractAllZeroResponse: DtrLoadUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 0, percentage: 0 },
                { label: "Moderate", value: 0, percentage: 0 },
                { label: "Balanced", value: 0, percentage: 0 },
            ],
        },
        message: dtrLoadUnbalanceSuccessMessage,
    };

/** Contract — mixed fleet distribution with percentages summing to 100. */
export const dtrLoadUnbalanceContractMixedResponse: DtrLoadUnbalanceResponse = {
    success: true,
    data: {
        items: [
            { label: "Severe", value: 10, percentage: 10 },
            { label: "Moderate", value: 30, percentage: 30 },
            { label: "Balanced", value: 60, percentage: 60 },
        ],
    },
    message: dtrLoadUnbalanceSuccessMessage,
};

/** Contract — all DTRs balanced. */
export const dtrLoadUnbalanceContractAllBalancedResponse: DtrLoadUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 0, percentage: 0 },
                { label: "Moderate", value: 0, percentage: 0 },
                { label: "Balanced", value: 100, percentage: 100 },
            ],
        },
        message: dtrLoadUnbalanceSuccessMessage,
    };

/** Contract — all DTRs severe unbalance. */
export const dtrLoadUnbalanceContractAllSevereResponse: DtrLoadUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 50, percentage: 100 },
                { label: "Moderate", value: 0, percentage: 0 },
                { label: "Balanced", value: 0, percentage: 0 },
            ],
        },
        message: dtrLoadUnbalanceSuccessMessage,
    };

/** Contract — rounded percentages still consistent with values. */
export const dtrLoadUnbalanceContractPercentageConsistencyResponse: DtrLoadUnbalanceResponse =
    {
        success: true,
        data: {
            items: [
                { label: "Severe", value: 1, percentage: 33.33 },
                { label: "Moderate", value: 1, percentage: 33.33 },
                { label: "Balanced", value: 1, percentage: 33.34 },
            ],
        },
        message: dtrLoadUnbalanceSuccessMessage,
    };

export interface DtrLoadUnbalanceTestCase {
    testName: string;
    scenario: DtrLoadUnbalanceScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function resolveDtrLoadUnbalanceQuery(
    scenario: DtrLoadUnbalanceScenario,
): DtrLoadUnbalanceQuery {
    switch (scenario) {
        case "dev_ignore_unknown_query":
            return { foo: "bar", period: "daily" };
        default:
            return {};
    }
}

export function resolveDtrLoadUnbalanceContractBody(
    scenario: DtrLoadUnbalanceScenario,
): DtrLoadUnbalanceResponse | null {
    switch (scenario) {
        case "contract_all_zero":
            return dtrLoadUnbalanceContractAllZeroResponse;
        case "contract_mixed_distribution":
            return dtrLoadUnbalanceContractMixedResponse;
        case "contract_all_balanced":
            return dtrLoadUnbalanceContractAllBalancedResponse;
        case "contract_all_severe":
            return dtrLoadUnbalanceContractAllSevereResponse;
        case "contract_percentage_consistency":
            return dtrLoadUnbalanceContractPercentageConsistencyResponse;
        default:
            return null;
    }
}

export const dtrLoadUnbalanceTestCases: DtrLoadUnbalanceTestCase[] = [
    {
        testName:
            "Validate GET /indore/dashboard/dtr/load-unbalance — live distribution",
        scenario: "dev_live_primary",
        tags: ["@smoke", "@dashboard", "@dtr-load-unbalance"],
    },
    {
        testName:
            "Validate GET /indore/dashboard/dtr/load-unbalance — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-load-unbalance", "@edge"],
    },
    {
        testName:
            "Contract — all-zero Severe/Moderate/Balanced distribution (13 Jul 2026)",
        scenario: "contract_all_zero",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-load-unbalance", "@edge"],
    },
    {
        testName: "Contract — mixed Severe/Moderate/Balanced distribution",
        scenario: "contract_mixed_distribution",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-load-unbalance", "@edge"],
    },
    {
        testName: "Contract — all DTRs Balanced",
        scenario: "contract_all_balanced",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-load-unbalance", "@edge"],
    },
    {
        testName: "Contract — all DTRs Severe",
        scenario: "contract_all_severe",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-load-unbalance", "@edge"],
    },
    {
        testName: "Contract — percentage consistency with rounding",
        scenario: "contract_percentage_consistency",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-load-unbalance", "@edge"],
    },
];
