import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type DtrSearchScenario =
  | "smoke_default"
  | "edge_limit_one"
  | "edge_page_beyond"
  | "negative_page_zero"
  | "negative_limit_zero";

export interface DtrSearchQuery {
  page?: number;
  limit?: number;
}

export function resolveDtrSearchQuery(
  scenario: DtrSearchScenario,
): DtrSearchQuery {
  switch (scenario) {
    case "smoke_default":
      return { page: 1, limit: 20 };
    case "edge_limit_one":
      return { page: 1, limit: 1 };
    case "edge_page_beyond":
      return { page: 7000, limit: 20 };
    case "negative_page_zero":
      return { page: 0, limit: 20 };
    case "negative_limit_zero":
      return { page: 1, limit: 0 };
    default:
      return { page: 1, limit: 20 };
  }
}

export interface DtrSearchTestCase extends LookupTestCase {
  scenario: DtrSearchScenario;
}

export const dtrSearchTestCases: DtrSearchTestCase[] = [
  {
    testName: "Validate DTR search — default page and limit",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@dtr-search"],
  },
  {
    testName: "Validate DTR search — limit 1 caps rows",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@dtr-search", "@edge"],
  },
  {
    testName: "Validate DTR search — page beyond totalPages returns empty",
    scenario: "edge_page_beyond",
    tags: ["@utils-lookup", "@dtr-search", "@edge"],
  },
  {
    testName: "Validate DTR search — page=0 rejected",
    scenario: "negative_page_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@dtr-search", "@negative"],
  },
  {
    testName: "Validate DTR search — limit=0 rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@dtr-search", "@negative"],
  },
];
