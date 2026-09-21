import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerMasterQuery } from "../Mapper/consumer-master.mapper";

export const EXPECTED_CONSUMER_MASTER_COLUMNS = [
  { key: "slNo", header: "SL No." },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "circle", header: "Circle" },
  { key: "feederName", header: "Feeder" },
  { key: "feederCode", header: "Feeder Code" },
  { key: "dtrCode", header: "DTR" },
  { key: "newDtrCode", header: "New DTR" },
  { key: "dtrCapacity", header: "DTR Capacity" },
  { key: "consumerName", header: "Consumer" },
  { key: "consumerAddress", header: "Address" },
  { key: "consumerMobileNumber", header: "Mobile" },
  { key: "category", header: "Category" },
  { key: "sanctionedLoadKw", header: "Load" },
  { key: "ivrsNo", header: "IVRS" },
  { key: "meterSerialNumber", header: "Meter" },
  { key: "meterMake", header: "Meter Make" },
  { key: "meterPhase", header: "Phase" },
  { key: "mf", header: "MF" },
  { key: "installationDate", header: "Installation Date" },
  { key: "latitude", header: "Latitude" },
  { key: "longitude", header: "Longitude" },
  { key: "connectedToDcu", header: "Connected to DCU" },
] as const;

export const consumerMasterDefaultQuery = {
  page: 1,
  limit: 20,
  meterType: "all" as const,
  includeArchiveCounts: true,
};

export const consumerMasterPage2Query = {
  page: 2,
  limit: 20,
  meterType: "all" as const,
  includeArchiveCounts: true,
};

export const consumerMasterSmallPageQuery = {
  page: 1,
  limit: 10,
  meterType: "all" as const,
  includeArchiveCounts: true,
};

/** Sample meter serial present in local/live consumer master; override with CONSUMER_MASTER_SEARCH_Q */
export const consumerMasterDefaultSearchTerm = "92572793";

export function resolveConsumerMasterSearchTerm(): string {
  const fromEnv = process.env.CONSUMER_MASTER_SEARCH_Q?.trim();
  return fromEnv || consumerMasterDefaultSearchTerm;
}

export const consumerMasterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface ConsumerMasterTestCase {
  testName: string;
  query: ConsumerMasterQuery;
  tags: string[];
  searchTerm?: string;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const consumerMasterTestCases: ConsumerMasterTestCase[] = [
  {
    testName: "Consumer list — first page shows columns, records, and page numbers",
    query: { ...consumerMasterDefaultQuery },
    tags: ["@smoke", "@master-data", "@consumer-master"],
    nonEmptyExpected: true,
  },
  {
    testName: "Consumer list — page 2 shows the next set of records",
    query: { ...consumerMasterPage2Query },
    tags: ["@master-data", "@consumer-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer list — showing 10 per page returns at most 10 records",
    query: { ...consumerMasterSmallPageQuery },
    tags: ["@master-data", "@consumer-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer list — search finds the consumer name or meter serial",
    query: {
      ...consumerMasterDefaultQuery,
      q: resolveConsumerMasterSearchTerm(),
    },
    tags: ["@master-data", "@consumer-master"],
    nonEmptyExpected: false,
    searchTerm: resolveConsumerMasterSearchTerm(),
  },
  {
    testName: "Consumer list — live-meter filter shows live meters only",
    query: {
      ...consumerMasterDefaultQuery,
      meterType: "live",
    },
    tags: ["@master-data", "@consumer-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer list — test-meter filter shows test meters only",
    query: {
      ...consumerMasterDefaultQuery,
      meterType: "test",
    },
    tags: ["@master-data", "@consumer-master", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumer list — list still opens when archive counts are turned off",
    query: {
      page: 1,
      limit: 20,
      meterType: "all",
      includeArchiveCounts: false,
    },
    tags: ["@master-data", "@consumer-master", "@edge"],
    nonEmptyExpected: false,
  },
];
