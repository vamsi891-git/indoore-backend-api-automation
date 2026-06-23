export const ALLOWED_COMMUNICATION_STATUSES = [
  "communicating",
  "non-communicating",
  "unknown",
] as const;

export type CommunicationStatus = (typeof ALLOWED_COMMUNICATION_STATUSES)[number];

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

/** Backend rejects unknown as a query filter (400); kept for contract test only. */
export const meterCommunicationUnknownFilterQuery = {
  page: 1,
  limit: 20,
  communicationStatus: "unknown" as CommunicationStatus,
};

export const meterCommunicationMaxResponseTimeMs = 120_000;
