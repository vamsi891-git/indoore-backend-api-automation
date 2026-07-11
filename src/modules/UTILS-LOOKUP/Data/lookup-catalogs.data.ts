import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type CatalogScenario = "smoke" | "edge_structure";

export interface CatalogTestCase extends LookupTestCase {
  scenario: CatalogScenario;
}

function catalogCases(
  label: string,
  smokeTag: string,
  domainTag: string,
): CatalogTestCase[] {
  return [
    {
      testName: `Validate ${label} — live catalog`,
      scenario: "smoke",
      tags: ["@smoke", "@utils-lookup", domainTag],
    },
    {
      testName: `Validate ${label} — structure and uniqueness`,
      scenario: "edge_structure",
      tags: ["@utils-lookup", domainTag, "@edge"],
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

export const meterPhaseTestCases = catalogCases(
  "meter phases",
  "@meterphase",
  "@meter-phase",
);

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
}

/** Documented missing UTILS routes (HTML 404 until backend ships). */
export const missingLookupRouteTestCases: MissingRouteTestCase[] = [
  {
    testName: "Probe missing route — connection-types returns 404",
    path: "/indore/utils/connection-types",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
  },
  {
    testName: "Probe missing route — billing-cycles returns 404",
    path: "/indore/utils/billing-cycles",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
  },
  {
    testName: "Probe missing route — tods returns 404",
    path: "/indore/utils/tods",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
  },
  {
    testName: "Probe missing route — main-sub-meters returns 404",
    path: "/indore/utils/main-sub-meters",
    expectedStatus: 404,
    errorExpectation: "status-only",
    tags: ["@utils-lookup", "@negative", "@missing-route"],
  },
];
