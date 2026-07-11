import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type NetworkSearchScenario =
  | "smoke_default"
  | "edge_limit_one"
  | "negative_limit_zero"
  | "negative_limit_negative";

export interface NetworkSearchQuery {
  limit?: number;
}

export function resolveNetworkSearchQuery(
  scenario: NetworkSearchScenario,
): NetworkSearchQuery {
  switch (scenario) {
    case "smoke_default":
      return { limit: 20 };
    case "edge_limit_one":
      return { limit: 1 };
    case "negative_limit_zero":
      return { limit: 0 };
    case "negative_limit_negative":
      return { limit: -1 };
    default:
      return { limit: 20 };
  }
}

export interface NetworkSearchTestCase extends LookupTestCase {
  scenario: NetworkSearchScenario;
}

export const networkSearchTestCases: NetworkSearchTestCase[] = [
  {
    testName: "Validate network search — default limit",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@network-search"],
  },
  {
    testName: "Validate network search — limit 1",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@network-search", "@edge"],
  },
  {
    testName: "Validate network search — limit=0 rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@network-search", "@negative"],
  },
  {
    testName: "Validate network search — negative limit rejected",
    scenario: "negative_limit_negative",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@network-search", "@negative"],
  },
];
