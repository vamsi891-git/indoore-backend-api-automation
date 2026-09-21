import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrVoltageUnbalanceQuery } from "../Api/dtrvoltageunbalance.api";
import type {
  DtrVoltageUnbalanceResponse,
  DtrVoltageUnbalanceScenario,
} from "../Mapper/dtrvoltageunbalance.mapper";

export const dtrVoltageUnbalanceMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrVoltageUnbalanceSuccessMessage =
  "DTR voltage unbalance distribution fetched successfully.";

export {
  dtrUnbalanceUnauthorizedMessage as dtrVoltageUnbalanceUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as dtrVoltageUnbalanceAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Live sample from GET /dashboard/dtr/voltage-unbalance (all-zero fleet). */
export const dtrVoltageUnbalanceContractAllZeroResponse: DtrVoltageUnbalanceResponse = {
  success: true,
  data: {
    total: 0,
    items: [
      { label: "Severe", value: 0, percentage: 0 },
      { label: "Moderate", value: 0, percentage: 0 },
      { label: "Balanced", value: 0, percentage: 0 },
    ],
  },
  message: dtrVoltageUnbalanceSuccessMessage,
};

/** Contract — mixed fleet distribution with percentages summing to 100. */
export const dtrVoltageUnbalanceContractMixedResponse: DtrVoltageUnbalanceResponse = {
  success: true,
  data: {
    total: 100,
    items: [
      { label: "Severe", value: 10, percentage: 10 },
      { label: "Moderate", value: 30, percentage: 30 },
      { label: "Balanced", value: 60, percentage: 60 },
    ],
  },
  message: dtrVoltageUnbalanceSuccessMessage,
};

/** OpenAPI example — Voltage unbalance donut distribution. */
export const dtrVoltageUnbalanceContractOpenApiSampleResponse: DtrVoltageUnbalanceResponse = {
  success: true,
  data: {
    total: 341,
    items: [
      { label: "Severe", value: 8, percentage: 2.4 },
      { label: "Moderate", value: 38, percentage: 11.2 },
      { label: "Balanced", value: 295, percentage: 86.4 },
    ],
  },
  message: dtrVoltageUnbalanceSuccessMessage,
};

/** Contract — all DTRs balanced. */
export const dtrVoltageUnbalanceContractAllBalancedResponse: DtrVoltageUnbalanceResponse = {
  success: true,
  data: {
    total: 100,
    items: [
      { label: "Severe", value: 0, percentage: 0 },
      { label: "Moderate", value: 0, percentage: 0 },
      { label: "Balanced", value: 100, percentage: 100 },
    ],
  },
  message: dtrVoltageUnbalanceSuccessMessage,
};

/** Contract — all DTRs severe unbalance. */
export const dtrVoltageUnbalanceContractAllSevereResponse: DtrVoltageUnbalanceResponse = {
  success: true,
  data: {
    total: 50,
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
      total: 3,
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
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
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
    case "contract_openapi_sample":
      return dtrVoltageUnbalanceContractOpenApiSampleResponse;
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
    testName: "DTR voltage unbalance — chart opens with Severe / Moderate / Balanced counts",
    scenario: "dev_live_primary",
    tags: ["@smoke", "@dashboard", "@dtr-voltage-unbalance"],
    nonEmptyExpected: true,
  },
  {
    testName: "DTR voltage unbalance — extra unused filters are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — all-zero Severe/Moderate/Balanced distribution",
    scenario: "contract_all_zero",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — mixed Severe/Moderate/Balanced distribution",
    scenario: "contract_mixed_distribution",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — OpenAPI sample (total 341)",
    scenario: "contract_openapi_sample",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — all DTRs Balanced",
    scenario: "contract_all_balanced",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — all DTRs Severe",
    scenario: "contract_all_severe",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — percentage consistency with rounding",
    scenario: "contract_percentage_consistency",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance", "@edge"],
    nonEmptyExpected: false,
  },
];
