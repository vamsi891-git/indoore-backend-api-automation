import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { FeederMasterQuery } from "../Mapper/feeder-master.mapper";

/** Live GET /master-data/feeder-master-data column contract (key + header). */
export const EXPECTED_FEEDER_MASTER_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "discomName", header: "Discom" },
  { key: "regionName", header: "Region" },
  { key: "circleName", header: "Circle" },
  { key: "divisionName", header: "Division" },
  { key: "zoneName", header: "Zone" },
  { key: "substationName", header: "Substation" },
  { key: "feederName", header: "Feeder" },
  { key: "dtrCount", header: "DTR Count" },
  { key: "consumerCount", header: "Consumer Count" },
] as const;

export const feederMasterDefaultQuery = {
  page: 1,
  limit: 20,
} as const;

export const feederMasterPage2Query = {
  page: 2,
  limit: 20,
} as const;

export const feederMasterSmallPageQuery = {
  page: 1,
  limit: 10,
} as const;

/** Sample feeder token from live; override with FEEDER_MASTER_SEARCH_Q */
export const feederMasterDefaultSearchTerm = "Dodiya";

export function resolveFeederMasterSearchTerm(): string {
  const fromEnv = process.env.FEEDER_MASTER_SEARCH_Q?.trim();
  return fromEnv || feederMasterDefaultSearchTerm;
}

export const feederMasterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface FeederMasterTestCase {
  testName: string;
  query: FeederMasterQuery;
  tags: string[];
  searchTerm?: string;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const feederMasterTestCases: FeederMasterTestCase[] = [
  {
    testName: "Feeder list — first page shows columns, records, and page numbers",
    query: { ...feederMasterDefaultQuery },
    tags: ["@smoke", "@master-data", "@feeder-master"],
    nonEmptyExpected: true,
  },
  {
    testName: "Feeder list — page 2 shows the next set of records",
    query: { ...feederMasterPage2Query },
    tags: ["@master-data", "@feeder-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Feeder list — a smaller page size shows fewer records",
    query: { ...feederMasterSmallPageQuery },
    tags: ["@master-data", "@feeder-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Feeder list — search finds the feeder name",
    query: {
      ...feederMasterDefaultQuery,
      q: resolveFeederMasterSearchTerm(),
    },
    tags: ["@master-data", "@feeder-master"],
    nonEmptyExpected: false,
    searchTerm: resolveFeederMasterSearchTerm(),
  },
  {
    testName: "Feeder list — an empty search shows the full list",
    query: { ...feederMasterDefaultQuery, q: "" },
    tags: ["@master-data", "@feeder-master", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Feeder list — a page past the last page shows no records",
    query: { page: 99999, limit: 20 },
    tags: ["@master-data", "@feeder-master", "@edge"],
    nonEmptyExpected: false,
  },
];
