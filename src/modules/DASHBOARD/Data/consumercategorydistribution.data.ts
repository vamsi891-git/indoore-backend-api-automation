import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerCategoryDistributionQuery } from "../Api/consumercategorydistribution.api";
import type {
  ConsumerCategoryDistributionResponse,
  ConsumerCategoryDistributionScenario,
} from "../Mapper/consumercategorydistribution.mapper";

export const consumerCategoryDistributionMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const consumerCategoryDistributionSuccessMessage =
  "Data fetched successfully";

export {
  dtrUnbalanceUnauthorizedMessage as consumerCategoryDistributionUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as consumerCategoryDistributionAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Column keys from live sample (Aug 2026). Row-only extras: id, connectionStatus, lat/lng, manufacturerName. */
export const CONSUMER_CATEGORY_DISTRIBUTION_COLUMN_KEYS = [
  "slNo",
  "consumerName",
  "consumerAddress",
  "ivrs",
  "meterSerialNumber",
  "meterPhase",
  "serviceDate",
] as const;

/**
 * Query category display names → metrics `categoryWiseConsumer` keys.
 * Backend matches LOWER(BTRIM(M_Category.CategoryName)).
 */
export const CONSUMER_CATEGORY_DISTRIBUTION_METRICS_KEY: Record<string, string> =
  {
    Residential: "residential",
    Commercial: "commercial",
    Industrial: "industrial",
    Temporary: "temporary",
    "Street Light": "streetLight",
    "Electric Vehicle Charging Station": "electricVehicleChargingStation",
  };

const columns = [
  { key: "slNo", header: "Sl.No." },
  { key: "consumerName", header: "Consumer Name" },
  { key: "consumerAddress", header: "Consumer Address" },
  { key: "ivrs", header: "IVRS" },
  { key: "meterSerialNumber", header: "Meter Sl No." },
  { key: "meterPhase", header: "Phase" },
  { key: "serviceDate", header: "Service Date" },
];

function sampleRow() {
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
    manufacturerName: "El Sewedy",
  };
}

function withRowsContract(): ConsumerCategoryDistributionResponse {
  return {
    success: true,
    data: {
      columns: [...columns],
      rows: [sampleRow()],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    message: consumerCategoryDistributionSuccessMessage,
  };
}

export const consumerCategoryDistributionContractResidential =
  withRowsContract();
export const consumerCategoryDistributionContractCommercial =
  withRowsContract();

export const consumerCategoryDistributionContractResidentialEmpty: ConsumerCategoryDistributionResponse =
  {
    success: true,
    data: {
      columns: [...columns],
      rows: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
    message: consumerCategoryDistributionSuccessMessage,
  };

export interface ConsumerCategoryDistributionTestCase {
  testName: string;
  scenario: ConsumerCategoryDistributionScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function categoryForScenario(
  scenario: ConsumerCategoryDistributionScenario,
): string {
  switch (scenario) {
    case "dev_live_commercial":
    case "contract_commercial":
      return "Commercial";
    case "dev_live_industrial":
      return "Industrial";
    default:
      return "Residential";
  }
}

export function resolveConsumerCategoryDistributionQuery(
  scenario: ConsumerCategoryDistributionScenario,
): ConsumerCategoryDistributionQuery {
  const category = categoryForScenario(scenario);
  switch (scenario) {
    case "dev_live_page_limit":
      return { category, page: 1, limit: 5 };
    case "dev_ignore_unknown_query":
      return { category, page: 1, limit: 20, foo: "bar" };
    default:
      return { category, page: 1, limit: 20 };
  }
}

export function resolveConsumerCategoryDistributionContractBody(
  scenario: ConsumerCategoryDistributionScenario,
): ConsumerCategoryDistributionResponse | null {
  switch (scenario) {
    case "contract_residential":
      return consumerCategoryDistributionContractResidential;
    case "contract_commercial":
      return consumerCategoryDistributionContractCommercial;
    case "contract_residential_empty":
      return consumerCategoryDistributionContractResidentialEmpty;
    default:
      return null;
  }
}

export const consumerCategoryDistributionTestCases: ConsumerCategoryDistributionTestCase[] =
  [
    {
      testName: "Consumers by category — residential connections",
      scenario: "dev_live_residential",
      tags: ["@smoke", "@dashboard", "@consumer-category-distribution"],
    },
    {
      testName: "Consumers by category — commercial connections",
      scenario: "dev_live_commercial",
      tags: ["@dashboard", "@consumer-category-distribution"],
    },
    {
      testName: "Consumers by category — industrial connections",
      scenario: "dev_live_industrial",
      tags: ["@dashboard", "@consumer-category-distribution"],
    },
    {
      testName: "Consumers by category — page 2 still shows a valid list",
      scenario: "dev_live_page_limit",
      tags: ["@dashboard", "@consumer-category-distribution", "@edge"],
    },
    {
      testName: "Consumers by category — extra unused filters are ignored",
      scenario: "dev_ignore_unknown_query",
      tags: ["@dashboard", "@consumer-category-distribution", "@edge"],
    },
    {
      testName: "Saved example — Residential with rows (offline)",
      scenario: "contract_residential",
      isContractFixture: true,
      tags: ["@contract", "@dashboard", "@consumer-category-distribution"],
    },
    {
      testName: "Saved example — Commercial with rows (offline)",
      scenario: "contract_commercial",
      isContractFixture: true,
      tags: ["@contract", "@dashboard", "@consumer-category-distribution"],
    },
    {
      testName: "Saved example — Residential empty page (offline)",
      scenario: "contract_residential_empty",
      isContractFixture: true,
      tags: ["@contract", "@dashboard", "@consumer-category-distribution"],
    },
  ];
