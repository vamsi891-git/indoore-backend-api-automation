import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type OrganizationSearchScenario =
  | "smoke_default"
  | "edge_limit_one"
  | "negative_limit_zero"
  | "negative_limit_negative";

export interface OrganizationSearchQuery {
  limit?: number;
}

export function resolveOrganizationSearchQuery(
  scenario: OrganizationSearchScenario,
): OrganizationSearchQuery {
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

export interface OrganizationSearchTestCase extends LookupTestCase {
  scenario: OrganizationSearchScenario;
}

export const organizationSearchTestCases: OrganizationSearchTestCase[] = [
  {
    testName: "Validate organisation search — default limit",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@organisation-search"],
  },
  {
    testName: "Validate organisation search — limit 1",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@organisation-search", "@edge"],
  },
  {
    testName: "Validate organisation search — limit=0 rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@organisation-search", "@negative"],
  },
  {
    testName: "Validate organisation search — negative limit rejected",
    scenario: "negative_limit_negative",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@organisation-search", "@negative"],
  },
];
