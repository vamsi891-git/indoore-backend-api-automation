import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type ConsumerSearchScenario =
  | "smoke_default"
  | "edge_page_two"
  | "edge_limit_one"
  | "edge_page_beyond"
  | "negative_page_zero"
  | "negative_limit_zero"
  | "negative_page_nan";

export interface ConsumerSearchQuery {
  page?: number | string;
  limit?: number;
}

export function resolveConsumerSearchQuery(
  scenario: ConsumerSearchScenario,
): ConsumerSearchQuery {
  switch (scenario) {
    case "smoke_default":
      return { page: 1, limit: 20 };
    case "edge_page_two":
      return { page: 2, limit: 20 };
    case "edge_limit_one":
      return { page: 1, limit: 1 };
    case "edge_page_beyond":
      return { page: 7000, limit: 20 };
    case "negative_page_zero":
      return { page: 0, limit: 20 };
    case "negative_limit_zero":
      return { page: 1, limit: 0 };
    case "negative_page_nan":
      return { page: "abc", limit: 20 };
    default:
      return { page: 1, limit: 20 };
  }
}

export interface ConsumerSearchTestCase extends LookupTestCase {
  scenario: ConsumerSearchScenario;
}

export const consumerSearchTestCases: ConsumerSearchTestCase[] = [
  {
    testName: "Validate consumer search — default page and limit",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@consumer-search"],
  },
  {
    testName: "Validate consumer search — page 2 pagination",
    scenario: "edge_page_two",
    tags: ["@utils-lookup", "@consumer-search", "@edge"],
  },
  {
    testName: "Validate consumer search — limit 1 caps rows",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@consumer-search", "@edge"],
  },
  {
    testName: "Validate consumer search — page beyond totalPages returns empty",
    scenario: "edge_page_beyond",
    tags: ["@utils-lookup", "@consumer-search", "@edge"],
  },
  {
    testName: "Validate consumer search — page=0 rejected",
    scenario: "negative_page_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@consumer-search", "@negative"],
  },
  {
    testName: "Validate consumer search — limit=0 rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@consumer-search", "@negative"],
  },
  {
    testName: "Validate consumer search — non-numeric page rejected",
    scenario: "negative_page_nan",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@consumer-search", "@negative"],
  },
];
