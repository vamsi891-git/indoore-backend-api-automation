import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { SubstationMasterQuery } from "../Mapper/substation-master.mapper";

/** Live GET /master-data/substation-master-data column contract (key + header). */
export const EXPECTED_SUBSTATION_MASTER_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "discomName", header: "Discom" },
  { key: "regionName", header: "Region" },
  { key: "circleName", header: "Circle" },
  { key: "divisionName", header: "Division" },
  { key: "zoneName", header: "Zone" },
  { key: "substationName", header: "Substation" },
  { key: "substationCode", header: "Substation Code" },
  { key: "dtrCount", header: "DTR Count" },
  { key: "consumerCount", header: "Consumer Count" },
] as const;

export const substationMasterDefaultQuery = {
  page: 1,
  limit: 20,
} as const;

export const substationMasterPage2Query = {
  page: 2,
  limit: 20,
} as const;

export const substationMasterSmallPageQuery = {
  page: 1,
  limit: 10,
} as const;

/** Sample substation token from live; override with SUBSTATION_MASTER_SEARCH_Q */
export const substationMasterDefaultSearchTerm = "Airport";

export function resolveSubstationMasterSearchTerm(): string {
  const fromEnv = process.env.SUBSTATION_MASTER_SEARCH_Q?.trim();
  return fromEnv || substationMasterDefaultSearchTerm;
}

export const substationMasterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface SubstationMasterTestCase {
  testName: string;
  query: SubstationMasterQuery;
  tags: string[];
  searchTerm?: string;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const substationMasterTestCases: SubstationMasterTestCase[] = [
  {
    testName: "Substation list — first page shows columns, records, and page numbers",
    query: { ...substationMasterDefaultQuery },
    tags: ["@smoke", "@master-data", "@substation-master"],
    nonEmptyExpected: true,
  },
  {
    testName: "Substation list — page 2 shows the next set of records",
    query: { ...substationMasterPage2Query },
    tags: ["@master-data", "@substation-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Substation list — a smaller page size shows fewer records",
    query: { ...substationMasterSmallPageQuery },
    tags: ["@master-data", "@substation-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Substation list — search finds the substation name",
    query: {
      ...substationMasterDefaultQuery,
      q: resolveSubstationMasterSearchTerm(),
    },
    tags: ["@master-data", "@substation-master"],
    nonEmptyExpected: false,
    searchTerm: resolveSubstationMasterSearchTerm(),
  },
  {
    testName: "Substation list — an empty search shows the full list",
    query: { ...substationMasterDefaultQuery, q: "" },
    tags: ["@master-data", "@substation-master", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Substation list — a page past the last page shows no records",
    query: { page: 99999, limit: 20 },
    tags: ["@master-data", "@substation-master", "@edge"],
    nonEmptyExpected: false,
  },
];
