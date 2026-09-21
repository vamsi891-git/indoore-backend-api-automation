import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { MeterMasterQuery } from "../Mapper/meter-master.mapper";

export const EXPECTED_METER_MASTER_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "meterSerialNumber", header: "Meter SL No." },
  { key: "connection", header: "Connection" },
  { key: "meterRapdrpCode", header: "Meter RAPDRP Code" },
  { key: "assetId", header: "Asset ID" },
  { key: "mf", header: "MF" },
  { key: "simNumber", header: "SIM Number" },
  { key: "ismiNumber", header: "IMSI Number" },
  { key: "ipAddress", header: "IP Address" },
  { key: "modemSerialNumber", header: "Modem Serial No." },
  { key: "modemImeiNumber", header: "Modem IMEI No." },
  { key: "isActiveStatus", header: "Status" },
] as const;

export const meterMasterDefaultQuery = {
  page: 1,
  limit: 20,
} as const;

export const meterMasterPage2Query = {
  page: 2,
  limit: 20,
} as const;

export const meterMasterSmallPageQuery = {
  page: 1,
  limit: 10,
} as const;

/** Sample serial from live API; override with METER_MASTER_SEARCH_Q in .env */
export const meterMasterDefaultSearchTerm = "000248045";

export function resolveMeterMasterSearchTerm(): string {
  const fromEnv = process.env.METER_MASTER_SEARCH_Q?.trim();
  return fromEnv || meterMasterDefaultSearchTerm;
}

export const meterMasterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface MeterMasterTestCase {
  testName: string;
  query: MeterMasterQuery;
  tags: string[];
  /** When set, runs search-result assertions against returned rows */
  searchTerm?: string;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const meterMasterTestCases: MeterMasterTestCase[] = [
  {
    testName: "Meter list — first page shows columns, records, and page numbers",
    query: { ...meterMasterDefaultQuery },
    tags: ["@smoke", "@master-data", "@meter-master"],
    nonEmptyExpected: true,
  },
  {
    testName: "Meter list — page 2 shows the next set of records",
    query: { ...meterMasterPage2Query },
    tags: ["@master-data", "@meter-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Meter list — showing 10 per page returns at most 10 records",
    query: { ...meterMasterSmallPageQuery },
    tags: ["@master-data", "@meter-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Meter list — search finds the meter serial",
    query: {
      ...meterMasterDefaultQuery,
      q: resolveMeterMasterSearchTerm(),
    },
    tags: ["@master-data", "@meter-master"],
    nonEmptyExpected: false,
    searchTerm: resolveMeterMasterSearchTerm(),
  },
  {
    testName: "Meter list — an empty search shows the full list",
    query: { ...meterMasterDefaultQuery, q: "" },
    tags: ["@master-data", "@meter-master", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Meter list — a page past the last page shows no records",
    query: { page: 99999, limit: 20 },
    tags: ["@master-data", "@meter-master", "@edge"],
    nonEmptyExpected: false,
  },
];
