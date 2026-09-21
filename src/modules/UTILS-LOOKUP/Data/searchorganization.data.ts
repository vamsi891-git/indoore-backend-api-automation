import type { LookupTestCase } from "../utils/lookup-spec.harness";
import type { OrganizationSearchQuery } from "../Api/searchorganization.api";

export type { OrganizationSearchQuery };

export type OrganizationSearchScenario =
  | "smoke_default"
  | "edge_limit_one"
  | "negative_limit_zero"
  | "negative_limit_negative";

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
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const organizationSearchTestCases: OrganizationSearchTestCase[] = [
  {
    testName: "Organisation search — default limit returns records",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@organisation-search"],
    nonEmptyExpected: true,
  },
  {
    testName: "Organisation search — limit 1 returns at most 1 record",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@organisation-search", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Organisation search — limit 0 is rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@organisation-search", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Organisation search — a negative limit is rejected",
    scenario: "negative_limit_negative",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@organisation-search", "@negative"],
    nonEmptyExpected: false,
  },
];
