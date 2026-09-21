import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { MeterCommunicationStatusQuery } from "../Mapper/meter-communication-status.mapper";

export const ALLOWED_COMMUNICATION_STATUSES = [
  "communicating",
  "non-communicating",
  "unknown",
] as const;

export type CommunicationStatus = (typeof ALLOWED_COMMUNICATION_STATUSES)[number];

/** Live GET /master-data/meter-communication-status column contract. */
export const EXPECTED_METER_COMM_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "communicationStatus", header: "Communication Status" },
  { key: "lastCommunication", header: "Last Communication" },
] as const;

export const meterCommunicationDefaultQuery = {
  page: 1,
  limit: 20,
} as const;

export const meterCommunicationPage2Query = {
  page: 2,
  limit: 20,
} as const;

export const meterCommunicationSmallPageQuery = {
  page: 1,
  limit: 10,
} as const;

export const meterCommunicationCommunicatingFilterQuery = {
  page: 1,
  limit: 20,
  communicationStatus: "communicating" as CommunicationStatus,
};

export const meterCommunicationNonCommunicatingFilterQuery = {
  page: 1,
  limit: 20,
  communicationStatus: "non-communicating" as CommunicationStatus,
};

/** Backend rejects unknown as a query filter (400); kept for negative contract. */
export const meterCommunicationUnknownFilterQuery = {
  page: 1,
  limit: 20,
  communicationStatus: "unknown" as CommunicationStatus,
};

/** Sample serial token from live; override with METER_COMM_SEARCH_Q */
export const meterCommunicationDefaultSearchTerm = "000000";

export function resolveMeterCommunicationSearchTerm(): string {
  const fromEnv = process.env.METER_COMM_SEARCH_Q?.trim();
  return fromEnv || meterCommunicationDefaultSearchTerm;
}

/** Large fleet list — allow longer than default master-data timeout. */
export const meterCommunicationMaxResponseTimeMs = Math.max(
  MASTER_DATA_MAX_RESPONSE_TIME_MS,
  120_000,
);

export interface MeterCommunicationTestCase {
  testName: string;
  query: MeterCommunicationStatusQuery;
  tags: string[];
  searchTerm?: string;
  communicationStatusFilter?: CommunicationStatus;
  skipCommunicatingTimestampCheck?: boolean;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const meterCommunicationTestCases: MeterCommunicationTestCase[] = [
  {
    testName: "Meter communication — first page shows columns, records, and page numbers",
    query: { ...meterCommunicationDefaultQuery },
    tags: ["@smoke", "@master-data", "@meter-communication"],
    nonEmptyExpected: true,
  },
  {
    testName: "Meter communication — page 2 shows the next set of records",
    query: { ...meterCommunicationPage2Query },
    tags: ["@master-data", "@meter-communication"],
    nonEmptyExpected: false,
  },
  {
    testName: "Meter communication — a smaller page size shows fewer records",
    query: { ...meterCommunicationSmallPageQuery },
    tags: ["@master-data", "@meter-communication"],
    nonEmptyExpected: false,
  },
  {
    testName: "Meter communication — communicating filter shows only communicating meters",
    query: { ...meterCommunicationCommunicatingFilterQuery },
    tags: ["@master-data", "@meter-communication"],
    nonEmptyExpected: false,
    communicationStatusFilter: "communicating",
    skipCommunicatingTimestampCheck: true,
  },
  {
    testName: "Meter communication — non-communicating filter shows only non-communicating meters",
    query: { ...meterCommunicationNonCommunicatingFilterQuery },
    tags: ["@master-data", "@meter-communication"],
    nonEmptyExpected: false,
    communicationStatusFilter: "non-communicating",
  },
  {
    testName: "Meter communication — search finds the meter serial",
    query: {
      ...meterCommunicationDefaultQuery,
      q: resolveMeterCommunicationSearchTerm(),
    },
    tags: ["@master-data", "@meter-communication"],
    nonEmptyExpected: false,
    searchTerm: resolveMeterCommunicationSearchTerm(),
    skipCommunicatingTimestampCheck: true,
  },
  {
    testName: "Meter communication — an empty search shows the full list",
    query: { ...meterCommunicationDefaultQuery, q: "" },
    tags: ["@master-data", "@meter-communication", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Meter communication — a page past the last page shows no records",
    query: { page: 99999, limit: 20 },
    tags: ["@master-data", "@meter-communication", "@edge"],
    nonEmptyExpected: false,
  },
];
