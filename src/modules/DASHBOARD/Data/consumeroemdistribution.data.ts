import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerOemDistributionQuery } from "../Api/consumeroemdistribution.api";
import type {
  ConsumerOemDistributionResponse,
  ConsumerOemDistributionScenario,
} from "../Mapper/consumeroemdistribution.mapper";

export const consumerOemDistributionMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const consumerOemDistributionSuccessMessage = "Data fetched successfully";

export {
  dtrUnbalanceUnauthorizedMessage as consumerOemDistributionUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as consumerOemDistributionAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/**
 * Column keys from live sample (Aug 2026).
 * Row-only extras: id, meterPhase, connectionStatus, serviceDate.
 */
export const CONSUMER_OEM_DISTRIBUTION_COLUMN_KEYS = [
  "slNo",
  "consumerName",
  "consumerAddress",
  "ivrs",
  "meterSerialNumber",
  "latitude",
  "longitude",
  "manufacturerName",
] as const;

/**
 * Query OEM aliases → metrics `oemWiseConsumer` keys (live Aug 2026).
 * Backend: listOemDrilldownRows + oemMetricsManufacturerPredicate (L&T / Linkwell).
 */
export const CONSUMER_OEM_DISTRIBUTION_METRICS_KEY: Record<string, string> = {
  "L&T": "L&T",
  Linkwell: "Linkwell Telesystems",
};

/** Primary OEMs exercised in live + DB harness (alias-focused). */
export const CONSUMER_OEM_DISTRIBUTION_OEMS = ["L&T", "Linkwell"] as const;
export type ConsumerOemAlias = (typeof CONSUMER_OEM_DISTRIBUTION_OEMS)[number];

const columns = [
  { key: "slNo", header: "Sl.No." },
  { key: "consumerName", header: "Consumer Name" },
  { key: "consumerAddress", header: "Consumer Address" },
  { key: "ivrs", header: "IVRS" },
  { key: "meterSerialNumber", header: "Meter Sl No." },
  { key: "latitude", header: "Latitude" },
  { key: "longitude", header: "Longitude" },
  { key: "manufacturerName", header: "Manufacturer Name" },
];

function sampleRow(oem: ConsumerOemAlias) {
  return {
    id: "meter-10",
    slNo: 1,
    consumerName: "Test consumer 1",
    consumerAddress: "12 MG Road, Indore",
    ivrs: "6428524820",
    meterSerialNumber: "20151631",
    meterPhase: "1 PH",
    connectionStatus: "Connected",
    latitude: "123.000000",
    longitude: "123.000000",
    serviceDate: "Jun 1, 2026 12:00 AM",
    manufacturerName: oem === "Linkwell" ? "LINKWELL TELESYSTEMS" : "L&T",
  };
}

function withRowsContract(oem: ConsumerOemAlias): ConsumerOemDistributionResponse {
  return {
    success: true,
    data: {
      columns: [...columns],
      rows: [sampleRow(oem)],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    message: consumerOemDistributionSuccessMessage,
  };
}

export const consumerOemDistributionContractLt = withRowsContract("L&T");
export const consumerOemDistributionContractLinkwell = withRowsContract("Linkwell");

export const consumerOemDistributionContractLtEmpty: ConsumerOemDistributionResponse = {
  success: true,
  data: {
    columns: [...columns],
    rows: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  },
  message: consumerOemDistributionSuccessMessage,
};

export interface ConsumerOemDistributionTestCase {
  testName: string;
  scenario: ConsumerOemDistributionScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function oemForScenario(scenario: ConsumerOemDistributionScenario): ConsumerOemAlias {
  switch (scenario) {
    case "dev_live_linkwell":
    case "contract_linkwell":
      return "Linkwell";
    default:
      return "L&T";
  }
}

export function resolveConsumerOemDistributionQuery(
  scenario: ConsumerOemDistributionScenario,
): ConsumerOemDistributionQuery {
  const oem = oemForScenario(scenario);
  switch (scenario) {
    case "dev_live_page_limit":
      return { oem, page: 1, limit: 5 };
    case "dev_ignore_unknown_query":
      return { oem, page: 1, limit: 20, foo: "bar" };
    default:
      return { oem, page: 1, limit: 20 };
  }
}

export function resolveConsumerOemDistributionContractBody(
  scenario: ConsumerOemDistributionScenario,
): ConsumerOemDistributionResponse | null {
  switch (scenario) {
    case "contract_lt":
      return consumerOemDistributionContractLt;
    case "contract_linkwell":
      return consumerOemDistributionContractLinkwell;
    case "contract_lt_empty":
      return consumerOemDistributionContractLtEmpty;
    default:
      return null;
  }
}

export const consumerOemDistributionTestCases: ConsumerOemDistributionTestCase[] = [
  {
    testName: "Consumers by meter make — L&T meters",
    scenario: "dev_live_lt",
    tags: ["@smoke", "@dashboard", "@consumer-oem-distribution"],
    nonEmptyExpected: true,
  },
  {
    testName: "Consumers by meter make — Linkwell meters",
    scenario: "dev_live_linkwell",
    tags: ["@dashboard", "@consumer-oem-distribution"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumers by meter make — page 2 still shows a valid list",
    scenario: "dev_live_page_limit",
    tags: ["@dashboard", "@consumer-oem-distribution", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Consumers by meter make — extra unused filters are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@dashboard", "@consumer-oem-distribution", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — L&T with rows (offline)",
    scenario: "contract_lt",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@consumer-oem-distribution"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — Linkwell with rows (offline)",
    scenario: "contract_linkwell",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@consumer-oem-distribution"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — L&T empty page (offline)",
    scenario: "contract_lt_empty",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@consumer-oem-distribution"],
    nonEmptyExpected: false,
  },
];
