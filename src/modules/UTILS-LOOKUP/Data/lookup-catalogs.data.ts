import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type CatalogScenario = "smoke" | "edge_structure";

export interface CatalogTestCase extends LookupTestCase {
  scenario: CatalogScenario;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

function catalogCases(label: string, smokeTag: string, domainTag: string): CatalogTestCase[] {
  return [
    {
      testName: `${label} — list shows ids and names`,
      scenario: "smoke",
      tags: ["@smoke", "@utils-lookup", domainTag],
      nonEmptyExpected: true,
    },
    {
      testName: `${label} — ids and names are unique`,
      scenario: "edge_structure",
      tags: ["@utils-lookup", domainTag, "@edge"],
      nonEmptyExpected: false,
    },
  ];
}

export const connectionStatusTestCases = catalogCases(
  "connection statuses",
  "@connection",
  "@connection-status",
);

export const consumerCategoryTestCases = catalogCases(
  "consumer categories",
  "@consumercategory",
  "@consumer-category",
);

export const meterPhaseTestCases = catalogCases("meter phases", "@meterphase", "@meter-phase");

export const paymentContractTestCases = catalogCases(
  "payment contracts",
  "@payment",
  "@payment-contract",
);

export const deviceManufacturerTestCases = catalogCases(
  "device manufacturers",
  "@manufacturer",
  "@device-manufacturer",
);

export const eventTestCases = catalogCases("events", "@events", "@utils-events");

export const eventClassificationTestCases = catalogCases(
  "event classifications",
  "@eventclassification",
  "@event-classification",
);

export const eventPriorityTestCases = catalogCases(
  "event priorities",
  "@eventpriority",
  "@event-priority",
);

export interface MissingRouteTestCase extends LookupTestCase {
  path: string;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

/** Documented missing UTILS routes (HTML 404 until backend ships). */
export const missingLookupRouteTestCases: MissingRouteTestCase[] = [
  {
    testName: "Connection types — missing route returns 404",
    path: "/indore/utils/connection-types",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing cycles — missing route returns 404",
    path: "/indore/utils/billing-cycles",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
    nonEmptyExpected: false,
  },
  {
    testName: "TODs — missing route returns 404",
    path: "/indore/utils/tods",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
    nonEmptyExpected: false,
  },
  {
    testName: "Main-sub meters — missing route returns 404",
    path: "/indore/utils/main-sub-meters",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
    nonEmptyExpected: false,
  },
];
