import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { MeterMasterQuery } from "../Mapper/meter-master.mapper";

export const EXPECTED_METER_MASTER_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "meterSerialNumber", header: "Meter SL No." },
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
}

export const meterMasterTestCases: MeterMasterTestCase[] = [
  {
    testName:
      "Validate GET /indore/master-data/meter-master-data — default page",
    query: { ...meterMasterDefaultQuery },
    tags: ["@smoke", "@master-data", "@meter-master"],
  },
  {
    testName: "Validate pagination — page 2",
    query: { ...meterMasterPage2Query },
    tags: ["@master-data", "@meter-master"],
  },
  {
    testName: "Validate pagination — smaller page size (limit 10)",
    query: { ...meterMasterSmallPageQuery },
    tags: ["@master-data", "@meter-master"],
  },
  {
    testName: "Validate search q — meter serial partial match",
    query: {
      ...meterMasterDefaultQuery,
      q: resolveMeterMasterSearchTerm(),
    },
    tags: ["@master-data", "@meter-master"],
    searchTerm: resolveMeterMasterSearchTerm(),
  },
];
