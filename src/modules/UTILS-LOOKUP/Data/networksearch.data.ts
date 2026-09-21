import type { LookupTestCase } from "../utils/lookup-spec.harness";
import type { NetworkSearchQuery } from "../Api/networksearch.api";

export type { NetworkSearchQuery };

export type NetworkSearchScenario =
  | "smoke_default"
  | "edge_limit_one"
  | "negative_limit_zero"
  | "negative_limit_negative";

export function resolveNetworkSearchQuery(scenario: NetworkSearchScenario): NetworkSearchQuery {
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
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const networkSearchTestCases: NetworkSearchTestCase[] = [
  {
    testName: "Network search — default limit returns records",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@network-search"],
    nonEmptyExpected: true,
  },
  {
    testName: "Network search — limit 1 returns at most 1 record",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@network-search", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Network search — limit 0 is rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@network-search", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Network search — a negative limit is rejected",
    scenario: "negative_limit_negative",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@network-search", "@negative"],
    nonEmptyExpected: false,
  },
];
