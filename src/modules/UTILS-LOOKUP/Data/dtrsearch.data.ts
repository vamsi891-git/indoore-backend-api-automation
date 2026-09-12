import type { LookupTestCase } from "../utils/lookup-spec.harness";
import type { DtrSearchQuery } from "../Api/dtrsearch.api";

export type { DtrSearchQuery };

/** Live GET /indore/utils/search/dtr — same grid as DTR master. */
export const EXPECTED_DTR_SEARCH_COLUMNS = [
  { key: "slNo", header: "Sl.No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Sub Station" },
  { key: "feederName", header: "Feeder Name" },
  { key: "feederCode", header: "Feeder Code" },
  { key: "dtrCode", header: "DTR Code" },
  { key: "newDtrCode", header: "New DTR Code" },
  { key: "dtrCapacity", header: "DTR Capacity" },
  { key: "meterSerialNumber", header: "Meter SL No" },
  { key: "meterMake", header: "Meter Make" },
  { key: "mf", header: "MF" },
  { key: "latitude", header: "Latitude" },
  { key: "longitude", header: "Longitude" },
  { key: "serviceDate", header: "ServiceDate" },
] as const;

export type DtrSearchScenario =
  | "smoke_default"
  | "edge_limit_one"
  | "edge_page_beyond"
  | "negative_page_zero"
  | "negative_limit_zero";

export function resolveDtrSearchQuery(
  scenario: DtrSearchScenario,
): DtrSearchQuery {
  switch (scenario) {
    case "smoke_default":
      return { page: 1, limit: 20 };
    case "edge_limit_one":
      return { page: 1, limit: 1 };
    case "edge_page_beyond":
      return { beyondTotalPages: true, limit: 20 };
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
    testName: "DTR search — first page shows columns and records",
    scenario: "smoke_default",
    tags: ["@smoke", "@utils-lookup", "@dtr-search"],
  },
  {
    testName: "DTR search — showing 1 per page returns at most 1 record",
    scenario: "edge_limit_one",
    tags: ["@utils-lookup", "@dtr-search", "@edge"],
  },
  {
    testName: "DTR search — a page past the last page shows no records",
    scenario: "edge_page_beyond",
    tags: ["@utils-lookup", "@dtr-search", "@edge"],
  },
  {
    testName: "DTR search — page 0 is rejected",
    scenario: "negative_page_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@dtr-search", "@negative"],
  },
  {
    testName: "DTR search — limit 0 is rejected",
    scenario: "negative_limit_zero",
    expectedStatus: 400,
    tags: ["@utils-lookup", "@dtr-search", "@negative"],
  },
];
