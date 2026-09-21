import type { LookupTestCase } from "../utils/lookup-spec.harness";
import type { ConsumerSearchQuery } from "../Api/consumersearch.api";

export type { ConsumerSearchQuery };

/** Live GET /indore/utils/search/consumers column contract. */
export const EXPECTED_CONSUMER_SEARCH_COLUMNS = [
  { key: "consumerName", header: "Consumer" },
  { key: "consumerCid", header: "Consumer CID" },
  { key: "consumerAddress", header: "Address" },
  { key: "ivrsNo", header: "IVRS" },
  { key: "meterSerialNumber", header: "Meter" },
  { key: "consumerMobileNumber", header: "Mobile" },
] as const;

export type ConsumerSearchScenario =
  | "smoke_default"
  | "edge_page_two"
  | "edge_limit_one"
  | "edge_page_beyond"
  | "negative_page_zero"
  | "negative_limit_zero"
  | "negative_page_nan";

export function resolveConsumerSearchQuery(scenario: ConsumerSearchScenario): ConsumerSearchQuery {
  switch (scenario) {
    case "smoke_default":
      return { page: 1, limit: 20 };
    case "edge_page_two":
      return { page: 2, limit: 20 };
    case "edge_limit_one":
      return { page: 1, limit: 1 };
    case "edge_page_beyond":
      return { beyondTotalPages: true, limit: 20 };
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
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const consumerSearchTestCases: ConsumerSearchTestCase[] = [
  {
    testName: "Consumer search — first page shows columns and records",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@consumer-search"],
    nonEmptyExpected: true,
  },
  {
    testName: "Consumer search — page 2 shows the next set of records",
    scenario: "edge_page_two",
    tags: ["@utils-lookup", "@consumer-search", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer search — showing 1 per page returns at most 1 record",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@consumer-search", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer search — a page past the last page shows no records",
    scenario: "edge_page_beyond",
    tags: ["@utils-lookup", "@consumer-search", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer search — page 0 is rejected",
    scenario: "negative_page_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@consumer-search", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer search — limit 0 is rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@consumer-search", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer search — a non-numeric page is rejected",
    scenario: "negative_page_nan",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@consumer-search", "@negative"],
    nonEmptyExpected: false,
  },
];
