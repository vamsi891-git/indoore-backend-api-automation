import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerMasterQuery } from "../Mapper/consumer-master.mapper";

export const EXPECTED_CONSUMER_MASTER_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "feederNameNew", header: "Feeder Name New" },
  { key: "dtrNameNew", header: "DTR Name New" },
  { key: "consumerCid", header: "Consumer CID" },
  { key: "consumerName", header: "Consumer Name" },
  { key: "consumerAddress", header: "Consumer Address" },
  { key: "consumerMobileNumber", header: "Mobile No." },
  { key: "category", header: "Category" },
  { key: "sanctionedLoadKw", header: "Sanctioned Load kW" },
  { key: "ivrsNo", header: "IVRS No." },
  { key: "existingIvrsNo", header: "Existing IVRS No." },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "meterPhase", header: "Phase" },
  { key: "mf", header: "MF" },
  { key: "installationDate", header: "Installation Date" },
  { key: "latitude", header: "Latitude" },
  { key: "longitude", header: "Longitude" },
  { key: "meterLookupTblRefId", header: "Meter Lookup Tbl Ref ID" },
  { key: "connectedToDcu", header: "Connected to DCU" },
  { key: "lsCount", header: "LS Count" },
  { key: "dpCount", header: "DP Count" },
] as const;

export const consumerMasterDefaultQuery = {
  page: 1,
  limit: 20,
  meterType: "all",
} as const;

export const consumerMasterPage2Query = {
  page: 2,
  limit: 20,
  meterType: "all",
} as const;

export const consumerMasterSmallPageQuery = {
  page: 1,
  limit: 10,
  meterType: "all",
} as const;

/** Sample IVRS from live API; override with CONSUMER_MASTER_SEARCH_Q in .env */
export const consumerMasterDefaultSearchTerm = "N3471011444";

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
}

export const consumerMasterTestCases: ConsumerMasterTestCase[] = [
  {
    testName:
      "Validate GET /indore/master-data/consumer-master-data — default page",
    query: { ...consumerMasterDefaultQuery },
    tags: ["@smoke", "@master-data", "@consumer-master"],
  },
  {
    testName: "Validate pagination — page 2",
    query: { ...consumerMasterPage2Query },
    tags: ["@master-data", "@consumer-master"],
  },
  {
    testName: "Validate pagination — smaller page size (limit 10)",
    query: { ...consumerMasterSmallPageQuery },
    tags: ["@master-data", "@consumer-master"],
  },
  {
    testName: "Validate search q — consumer or meter partial match",
    query: {
      ...consumerMasterDefaultQuery,
      q: resolveConsumerMasterSearchTerm(),
    },
    tags: ["@master-data", "@consumer-master"],
    searchTerm: resolveConsumerMasterSearchTerm(),
  },
];
