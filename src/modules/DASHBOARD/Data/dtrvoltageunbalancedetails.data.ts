import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrVoltageUnbalanceDetailsQuery } from "../Api/dtrvoltageunbalancedetails.api";
import type {
  DtrVoltageUnbalanceDetailsResponse,
  DtrVoltageUnbalanceDetailsScenario,
  DtrVoltageUnbalanceSeverity,
} from "../Mapper/dtrvoltageunbalancedetails.mapper";

export const dtrVoltageUnbalanceDetailsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrVoltageUnbalanceDetailsSuccessMessage =
  "DTR voltage unbalance details fetched successfully.";

export {
  dtrUnbalanceUnauthorizedMessage as dtrVoltageUnbalanceDetailsUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as dtrVoltageUnbalanceDetailsAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Hierarchy columns present for every severity (live samples Aug 2026). */
export const DTR_VOLTAGE_UNBALANCE_DETAILS_CORE_COLUMN_KEYS = [
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "logDate",
  "loadingCondition",
] as const;

/** Metric keys — backend column set differs by severity (severe exposes perUV). */
export const DTR_VOLTAGE_UNBALANCE_DETAILS_METRIC_KEYS_ANY_OF = [
  "voltageUnbalance",
  "perUV",
] as const;

/** Phase voltages always present on moderate/balanced; severe omits vbn. */
export const DTR_VOLTAGE_UNBALANCE_DETAILS_PHASE_VOLTAGE_KEYS = ["vrn", "vyn"] as const;

/** Moderate/balanced live columns (OpenAPI + Aug 2026 samples). */
const moderateBalancedColumns = [
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Sub Station" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "logDate", header: "Log Date" },
  { key: "loadingCondition", header: "Loading Condition" },
  { key: "voltageUnbalance", header: "Voltage Unbalance" },
  { key: "vrn", header: "VRN" },
  { key: "vyn", header: "VYN" },
  { key: "vbn", header: "VBN" },
];

/** Severe live columns — includes perUV, omits vbn (Aug 2026). */
const severeColumns = [
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Sub Station" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "logDate", header: "Log Date" },
  { key: "loadingCondition", header: "Loading Condition" },
  { key: "perUV", header: "perUV" },
  { key: "voltageUnbalance", header: "Voltage Unbalance" },
  { key: "vrn", header: "VRN" },
  { key: "vyn", header: "VYN" },
];

const emptyPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

/** Live sample — severity=severe, empty fleet page. */
export const dtrVoltageUnbalanceDetailsContractSevereEmpty: DtrVoltageUnbalanceDetailsResponse = {
  success: true,
  data: {
    columns: severeColumns,
    rows: [],
    pagination: { ...emptyPagination },
  },
  message: dtrVoltageUnbalanceDetailsSuccessMessage,
};

/** Live sample — severity=moderate, empty fleet page. */
export const dtrVoltageUnbalanceDetailsContractModerateEmpty: DtrVoltageUnbalanceDetailsResponse = {
  success: true,
  data: {
    columns: moderateBalancedColumns,
    rows: [],
    pagination: { ...emptyPagination },
  },
  message: dtrVoltageUnbalanceDetailsSuccessMessage,
};

/** Live sample — severity=balanced, empty fleet page. */
export const dtrVoltageUnbalanceDetailsContractBalancedEmpty: DtrVoltageUnbalanceDetailsResponse = {
  success: true,
  data: {
    columns: moderateBalancedColumns,
    rows: [],
    pagination: { ...emptyPagination },
  },
  message: dtrVoltageUnbalanceDetailsSuccessMessage,
};

/** Contract — severe page with one hydrated hierarchy row. */
export const dtrVoltageUnbalanceDetailsContractSevereWithRows: DtrVoltageUnbalanceDetailsResponse =
  {
    success: true,
    data: {
      columns: severeColumns,
      rows: [
        {
          id: "row-1-m-9001",
          circle: "Circle-A",
          division: "Division-1",
          zone: "Zone-1",
          subStation: "SS-1",
          feeder: "Feeder-1",
          dtr: "DTR-1",
          logDate: "2026-08-12T10:00:00.000Z",
          loadingCondition: "Severe",
          perUV: 1,
          voltageUnbalance: 42.5,
          vrn: 210.1,
          vyn: 180.2,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    },
    message: dtrVoltageUnbalanceDetailsSuccessMessage,
  };

/**
 * OpenAPI sample — balanced columns + row `id` + band label `<5%`.
 * Fixture keeps the reported pagination totals; row list is a single sample row.
 */
export const dtrVoltageUnbalanceDetailsContractBalancedWithRows: DtrVoltageUnbalanceDetailsResponse =
  {
    success: true,
    data: {
      columns: moderateBalancedColumns,
      rows: [
        {
          id: "row-1-m-1001",
          circle: "Indore city circle",
          division: "CENTRAL",
          zone: "Hawabangla",
          subStation: "PragatiNagar",
          feeder: "PARMANU NAGAR(CHQ)",
          dtr: "RJ6611",
          logDate: "13th Jul 2026, 02:00 AM",
          loadingCondition: "<5%",
          voltageUnbalance: 1.2,
          vrn: 230.1,
          vyn: 228.4,
          vbn: 229,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 295,
        totalPages: 30,
      },
    },
    message: dtrVoltageUnbalanceDetailsSuccessMessage,
  };

export interface DtrVoltageUnbalanceDetailsTestCase {
  testName: string;
  scenario: DtrVoltageUnbalanceDetailsScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function severityForScenario(
  scenario: DtrVoltageUnbalanceDetailsScenario,
): DtrVoltageUnbalanceSeverity {
  switch (scenario) {
    case "dev_live_moderate":
    case "contract_moderate_empty":
      return "moderate";
    case "dev_live_balanced":
    case "contract_balanced_empty":
    case "contract_balanced_with_rows":
      return "balanced";
    default:
      return "severe";
  }
}

export function resolveDtrVoltageUnbalanceDetailsQuery(
  scenario: DtrVoltageUnbalanceDetailsScenario,
): DtrVoltageUnbalanceDetailsQuery {
  const severity = severityForScenario(scenario);
  switch (scenario) {
    case "dev_live_page_limit":
      return { severity, page: 1, limit: 5 };
    case "dev_ignore_unknown_query":
      return { severity, page: 1, limit: 10, foo: "bar" };
    default:
      return { severity, page: 1, limit: 10 };
  }
}

export function resolveDtrVoltageUnbalanceDetailsContractBody(
  scenario: DtrVoltageUnbalanceDetailsScenario,
): DtrVoltageUnbalanceDetailsResponse | null {
  switch (scenario) {
    case "contract_severe_empty":
      return dtrVoltageUnbalanceDetailsContractSevereEmpty;
    case "contract_moderate_empty":
      return dtrVoltageUnbalanceDetailsContractModerateEmpty;
    case "contract_balanced_empty":
      return dtrVoltageUnbalanceDetailsContractBalancedEmpty;
    case "contract_severe_with_rows":
      return dtrVoltageUnbalanceDetailsContractSevereWithRows;
    case "contract_balanced_with_rows":
      return dtrVoltageUnbalanceDetailsContractBalancedWithRows;
    default:
      return null;
  }
}

export const dtrVoltageUnbalanceDetailsTestCases: DtrVoltageUnbalanceDetailsTestCase[] = [
  {
    testName: "DTR voltage unbalance list — severely unbalanced DTRs",
    scenario: "dev_live_severe",
    tags: ["@smoke", "@dashboard", "@dtr-voltage-unbalance-details"],
    nonEmptyExpected: true,
  },
  {
    testName: "DTR voltage unbalance list — moderately unbalanced DTRs",
    scenario: "dev_live_moderate",
    tags: ["@dashboard", "@dtr-voltage-unbalance-details"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR voltage unbalance list — balanced DTRs",
    scenario: "dev_live_balanced",
    tags: ["@dashboard", "@dtr-voltage-unbalance-details"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR voltage unbalance list — page 2 still shows a valid list",
    scenario: "dev_live_page_limit",
    tags: ["@dashboard", "@dtr-voltage-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR voltage unbalance list — extra unused filters are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@dashboard", "@dtr-voltage-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — severe empty page",
    scenario: "contract_severe_empty",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — moderate empty page",
    scenario: "contract_moderate_empty",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — balanced empty page",
    scenario: "contract_balanced_empty",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — severe page with hierarchy row",
    scenario: "contract_severe_with_rows",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — balanced OpenAPI sample (total 295)",
    scenario: "contract_balanced_with_rows",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-voltage-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
];
