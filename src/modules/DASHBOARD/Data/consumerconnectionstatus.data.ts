import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerConnectionStatusQuery } from "../Api/consumerconnectionstatus.api";
import type {
  ConsumerConnectionStatus,
  ConsumerConnectionStatusResponse,
  ConsumerConnectionStatusScenario,
} from "../Mapper/consumerconnectionstatus.mapper";

export const consumerConnectionStatusMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const consumerConnectionStatusSuccessMessage = "Data fetched successfully";

export {
  dtrUnbalanceUnauthorizedMessage as consumerConnectionStatusUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as consumerConnectionStatusAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Column keys from live samples (Aug 2026). Row-only: id, manufacturerName. */
export const CONSUMER_CONNECTION_STATUS_COLUMN_KEYS = [
  "slNo",
  "consumerName",
  "consumerAddress",
  "ivrs",
  "meterSerialNumber",
  "meterPhase",
  "connectionStatus",
  "latitude",
  "longitude",
  "serviceDate",
] as const;

/** Display labels for `connectionStatus` row field by query status. */
export const CONSUMER_CONNECTION_STATUS_LABELS: Record<ConsumerConnectionStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  "permanently-disconnected": "Permanent Disconnection",
};

/** Metrics `connectionStatus` map keys aligned with drill-down status. */
export const CONSUMER_CONNECTION_STATUS_METRICS_KEY: Record<ConsumerConnectionStatus, string> = {
  connected: "cd",
  disconnected: "td",
  "permanently-disconnected": "pd",
};

const columns = [
  { key: "slNo", header: "Sl.No." },
  { key: "consumerName", header: "Consumer Name" },
  { key: "consumerAddress", header: "Consumer Address" },
  { key: "ivrs", header: "IVRS" },
  { key: "meterSerialNumber", header: "Meter Sl No." },
  { key: "meterPhase", header: "Phase" },
  { key: "connectionStatus", header: "Connection Status" },
  { key: "latitude", header: "Latitude" },
  { key: "longitude", header: "Longitude" },
  { key: "serviceDate", header: "Service Date" },
];

function sampleRow(status: ConsumerConnectionStatus) {
  return {
    id: "meter-10",
    slNo: 1,
    consumerName: "Test consumer 1",
    consumerAddress: "12 MG Road, Indore",
    ivrs: "6428524820",
    meterSerialNumber: "20151631",
    meterPhase: "1 PH",
    connectionStatus: CONSUMER_CONNECTION_STATUS_LABELS[status],
    latitude: "123.000000",
    longitude: "123.000000",
    serviceDate: "Jun 1, 2026 12:00 AM",
    manufacturerName: "El Sewedy",
  };
}

function withRowsContract(status: ConsumerConnectionStatus): ConsumerConnectionStatusResponse {
  return {
    success: true,
    data: {
      columns: [...columns],
      rows: [sampleRow(status)],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    },
    message: consumerConnectionStatusSuccessMessage,
  };
}

export const consumerConnectionStatusContractConnected = withRowsContract("connected");
export const consumerConnectionStatusContractDisconnected = withRowsContract("disconnected");
export const consumerConnectionStatusContractPermanentlyDisconnected = withRowsContract(
  "permanently-disconnected",
);

export const consumerConnectionStatusContractConnectedEmpty: ConsumerConnectionStatusResponse = {
  success: true,
  data: {
    columns: [...columns],
    rows: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  },
  message: consumerConnectionStatusSuccessMessage,
};

export interface ConsumerConnectionStatusTestCase {
  testName: string;
  scenario: ConsumerConnectionStatusScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function statusForScenario(
  scenario: ConsumerConnectionStatusScenario,
): ConsumerConnectionStatus {
  switch (scenario) {
    case "dev_live_disconnected":
    case "contract_disconnected":
      return "disconnected";
    case "dev_live_permanently_disconnected":
    case "contract_permanently_disconnected":
      return "permanently-disconnected";
    default:
      return "connected";
  }
}

export function resolveConsumerConnectionStatusQuery(
  scenario: ConsumerConnectionStatusScenario,
): ConsumerConnectionStatusQuery {
  const status = statusForScenario(scenario);
  switch (scenario) {
    case "dev_live_page_limit":
      return { status, page: 1, limit: 5 };
    case "dev_ignore_unknown_query":
      return { status, page: 1, limit: 20, foo: "bar" };
    default:
      return { status, page: 1, limit: 20 };
  }
}

export function resolveConsumerConnectionStatusContractBody(
  scenario: ConsumerConnectionStatusScenario,
): ConsumerConnectionStatusResponse | null {
  switch (scenario) {
    case "contract_connected":
      return consumerConnectionStatusContractConnected;
    case "contract_disconnected":
      return consumerConnectionStatusContractDisconnected;
    case "contract_permanently_disconnected":
      return consumerConnectionStatusContractPermanentlyDisconnected;
    case "contract_connected_empty":
      return consumerConnectionStatusContractConnectedEmpty;
    default:
      return null;
  }
}

export const consumerConnectionStatusTestCases: ConsumerConnectionStatusTestCase[] = [
  {
    testName: "Consumers by connection status — connected consumers",
    scenario: "dev_live_connected",
    tags: ["@smoke", "@dashboard", "@consumer-connection-status"],
    nonEmptyExpected: true,
  },
  {
    testName: "Consumers by connection status — temporarily disconnected consumers",
    scenario: "dev_live_disconnected",
    tags: ["@dashboard", "@consumer-connection-status"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumers by connection status — permanently disconnected consumers",
    scenario: "dev_live_permanently_disconnected",
    tags: ["@dashboard", "@consumer-connection-status"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumers by connection status — page 2 still shows a valid list",
    scenario: "dev_live_page_limit",
    tags: ["@dashboard", "@consumer-connection-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumers by connection status — extra unused filters are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@dashboard", "@consumer-connection-status", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — connected with rows (offline)",
    scenario: "contract_connected",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@consumer-connection-status"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — disconnected with rows (offline)",
    scenario: "contract_disconnected",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@consumer-connection-status"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — permanently-disconnected with rows (offline)",
    scenario: "contract_permanently_disconnected",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@consumer-connection-status"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — connected empty page (offline)",
    scenario: "contract_connected_empty",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@consumer-connection-status"],
    nonEmptyExpected: false,
  },
];
