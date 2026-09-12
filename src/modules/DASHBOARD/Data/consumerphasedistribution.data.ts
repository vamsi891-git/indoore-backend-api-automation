import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerPhaseDistributionQuery } from "../Api/consumerphasedistribution.api";
import type {
  ConsumerPhase,
  ConsumerPhaseDistributionResponse,
  ConsumerPhaseDistributionScenario,
} from "../Mapper/consumerphasedistribution.mapper";

export const consumerPhaseDistributionMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const consumerPhaseDistributionSuccessMessage =
  "Data fetched successfully";

export {
  dtrUnbalanceUnauthorizedMessage as consumerPhaseDistributionUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as consumerPhaseDistributionAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Column keys from live sample (Aug 2026). Row-only extras: id, connectionStatus, lat/lng, manufacturerName. */
export const CONSUMER_PHASE_DISTRIBUTION_COLUMN_KEYS = [
  "slNo",
  "consumerName",
  "consumerAddress",
  "ivrs",
  "meterSerialNumber",
  "meterPhase",
  "serviceDate",
] as const;

/**
 * Query phase → metrics `phaseWiseConsumer` keys (dashboardmetrics live shape).
 * Backend: listPhaseDrilldownRows + phaseMetricsShortNamePredicate.
 */
export const CONSUMER_PHASE_DISTRIBUTION_METRICS_KEY: Record<
  ConsumerPhase,
  string
> = {
  "1 PH": "1ph",
  "3 PH WC": "3 ph wc",
  "3 PH 4 CT": "3 ph ct",
  HT: "ht",
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

function sampleRow(phase: ConsumerPhase) {
  const meterPhase =
    phase === "3 PH WC"
      ? "3PH WC"
      : phase === "3 PH 4 CT"
        ? "3PH 4CT"
        : phase;
  return {
    id: "meter-10",
    slNo: 1,
    consumerName: "Test consumer 1",
    consumerAddress: "12 MG Road, Indore",
    ivrs: "6428524820",
    meterSerialNumber: "20151631",
    meterPhase,
    connectionStatus: "Connected",
    latitude: "123.000000",
    longitude: "123.000000",
    serviceDate: "Jun 1, 2026 12:00 AM",
    manufacturerName: "El Sewedy",
  };
}

function withRowsContract(
  phase: ConsumerPhase,
): ConsumerPhaseDistributionResponse {
  return {
    success: true,
    data: {
      columns: [...columns],
      rows: [sampleRow(phase)],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    message: consumerPhaseDistributionSuccessMessage,
  };
}

export const consumerPhaseDistributionContract1ph = withRowsContract("1 PH");
export const consumerPhaseDistributionContract3phWc =
  withRowsContract("3 PH WC");

export const consumerPhaseDistributionContract1phEmpty: ConsumerPhaseDistributionResponse =
  {
    success: true,
    data: {
      columns: [...columns],
      rows: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
    message: consumerPhaseDistributionSuccessMessage,
  };

export interface ConsumerPhaseDistributionTestCase {
  testName: string;
  scenario: ConsumerPhaseDistributionScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function phaseForScenario(
  scenario: ConsumerPhaseDistributionScenario,
): ConsumerPhase {
  switch (scenario) {
    case "dev_live_3ph_wc":
    case "contract_3ph_wc":
      return "3 PH WC";
    case "dev_live_3ph_4ct":
      return "3 PH 4 CT";
    case "dev_live_ht":
      return "HT";
    default:
      return "1 PH";
  }
}

export function resolveConsumerPhaseDistributionQuery(
  scenario: ConsumerPhaseDistributionScenario,
): ConsumerPhaseDistributionQuery {
  const phase = phaseForScenario(scenario);
  switch (scenario) {
    case "dev_live_page_limit":
      return { phase, page: 1, limit: 5 };
    case "dev_ignore_unknown_query":
      return { phase, page: 1, limit: 20, foo: "bar" };
    default:
      return { phase, page: 1, limit: 20 };
  }
}

export function resolveConsumerPhaseDistributionContractBody(
  scenario: ConsumerPhaseDistributionScenario,
): ConsumerPhaseDistributionResponse | null {
  switch (scenario) {
    case "contract_1ph":
      return consumerPhaseDistributionContract1ph;
    case "contract_3ph_wc":
      return consumerPhaseDistributionContract3phWc;
    case "contract_1ph_empty":
      return consumerPhaseDistributionContract1phEmpty;
    default:
      return null;
  }
}

export const consumerPhaseDistributionTestCases: ConsumerPhaseDistributionTestCase[] =
  [
    {
      testName: "Consumers by meter phase — single-phase meters",
      scenario: "dev_live_1ph",
      tags: ["@smoke", "@dashboard", "@consumer-phase-distribution"],
    },
    {
      testName: "Consumers by meter phase — three-phase whole-current meters",
      scenario: "dev_live_3ph_wc",
      tags: ["@dashboard", "@consumer-phase-distribution"],
    },
    {
      testName: "Consumers by meter phase — three-phase CT meters",
      scenario: "dev_live_3ph_4ct",
      tags: ["@dashboard", "@consumer-phase-distribution"],
    },
    {
      testName: "Consumers by meter phase — high-tension meters",
      scenario: "dev_live_ht",
      tags: ["@dashboard", "@consumer-phase-distribution"],
    },
    {
      testName: "Consumers by meter phase — page 2 still shows a valid list",
      scenario: "dev_live_page_limit",
      tags: ["@dashboard", "@consumer-phase-distribution", "@edge"],
    },
    {
      testName: "Consumers by meter phase — extra unused filters are ignored",
      scenario: "dev_ignore_unknown_query",
      tags: ["@dashboard", "@consumer-phase-distribution", "@edge"],
    },
    {
      testName: "Saved example — 1 PH with rows (offline)",
      scenario: "contract_1ph",
      isContractFixture: true,
      tags: ["@contract", "@dashboard", "@consumer-phase-distribution"],
    },
    {
      testName: "Saved example — 3 PH WC with rows (offline)",
      scenario: "contract_3ph_wc",
      isContractFixture: true,
      tags: ["@contract", "@dashboard", "@consumer-phase-distribution"],
    },
    {
      testName: "Saved example — 1 PH empty page (offline)",
      scenario: "contract_1ph_empty",
      isContractFixture: true,
      tags: ["@contract", "@dashboard", "@consumer-phase-distribution"],
    },
  ];
