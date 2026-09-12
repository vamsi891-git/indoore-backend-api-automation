import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrMasterQuery } from "../Mapper/dtr-master.mapper";

/** Live GET /master-data/dtr-master-data column contract (key + header). */
export const EXPECTED_DTR_MASTER_COLUMNS = [
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

export const dtrMasterDefaultQuery = {
  page: 1,
  limit: 20,
} as const;

export const dtrMasterPage2Query = {
  page: 2,
  limit: 20,
} as const;

export const dtrMasterSmallPageQuery = {
  page: 1,
  limit: 10,
} as const;

/** Sample DTR / meter token from live; override with DTR_MASTER_SEARCH_Q */
export const dtrMasterDefaultSearchTerm = "10IW1";

export function resolveDtrMasterSearchTerm(): string {
  const fromEnv = process.env.DTR_MASTER_SEARCH_Q?.trim();
  return fromEnv || dtrMasterDefaultSearchTerm;
}

export const dtrMasterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface DtrMasterTestCase {
  testName: string;
  query: DtrMasterQuery;
  tags: string[];
  searchTerm?: string;
}

export const dtrMasterTestCases: DtrMasterTestCase[] = [
  {
    testName: "DTR list — first page shows columns, records, and page numbers",
    query: { ...dtrMasterDefaultQuery },
    tags: ["@smoke", "@master-data", "@dtr-master"],
  },
  {
    testName: "DTR list — page 2 shows the next set of records",
    query: { ...dtrMasterPage2Query },
    tags: ["@master-data", "@dtr-master"],
  },
  {
    testName: "DTR list — a smaller page size shows fewer records",
    query: { ...dtrMasterSmallPageQuery },
    tags: ["@master-data", "@dtr-master"],
  },
  {
    testName: "DTR list — search finds the DTR name or meter serial",
    query: {
      ...dtrMasterDefaultQuery,
      q: resolveDtrMasterSearchTerm(),
    },
    tags: ["@master-data", "@dtr-master"],
    searchTerm: resolveDtrMasterSearchTerm(),
  },
  {
    testName: "DTR list — an empty search shows the full list",
    query: { ...dtrMasterDefaultQuery, q: "" },
    tags: ["@master-data", "@dtr-master", "@edge"],
  },
  {
    testName: "DTR list — a page past the last page shows no records",
    query: { page: 99999, limit: 20 },
    tags: ["@master-data", "@dtr-master", "@edge"],
  },
];
