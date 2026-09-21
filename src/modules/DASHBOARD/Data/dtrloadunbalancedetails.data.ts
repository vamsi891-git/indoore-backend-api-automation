import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrLoadUnbalanceDetailsQuery } from "../Api/dtrloadunbalancedetails.api";
import type {
  DtrLoadUnbalanceDetailsResponse,
  DtrLoadUnbalanceDetailsScenario,
  DtrLoadUnbalanceSeverity,
} from "../Mapper/dtrloadunbalancedetails.mapper";

export const dtrLoadUnbalanceDetailsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrLoadUnbalanceDetailsSuccessMessage =
  "DTR load unbalance details fetched successfully.";

export {
  dtrUnbalanceUnauthorizedMessage as dtrLoadUnbalanceDetailsUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as dtrLoadUnbalanceDetailsAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Hierarchy columns present for every severity (live samples Aug 2026). */
export const DTR_LOAD_UNBALANCE_DETAILS_CORE_COLUMN_KEYS = [
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "logDate",
  "loadingCondition",
] as const;

/** Metric keys — backend column set differs by severity (severe has ib; moderate/balanced expose perUB). */
export const DTR_LOAD_UNBALANCE_DETAILS_METRIC_KEYS_ANY_OF = ["loadingUnbalance", "perUB"] as const;

export const DTR_LOAD_UNBALANCE_DETAILS_PHASE_CURRENT_KEYS = ["ir", "iy"] as const;

const severeColumns = [
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Sub Station" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "logDate", header: "Log Date" },
  { key: "loadingCondition", header: "Loading Condition" },
  { key: "loadingUnbalance", header: "Loading Unbalance" },
  { key: "ir", header: "IR" },
  { key: "iy", header: "IY" },
  { key: "ib", header: "IB" },
];

const moderateBalancedColumns = [
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Sub Station" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "logDate", header: "Log Date" },
  { key: "loadingCondition", header: "Loading Condition" },
  { key: "perUB", header: "per_UB" },
  { key: "ir", header: "IR" },
  { key: "iy", header: "IY" },
  { key: "loadingUnbalance", header: "Loading Unbalance" },
];

const emptyPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

/** Live sample — severity=severe, empty fleet page (Aug 2026). */
export const dtrLoadUnbalanceDetailsContractSevereEmpty: DtrLoadUnbalanceDetailsResponse = {
  success: true,
  data: {
    columns: severeColumns,
    rows: [],
    pagination: { ...emptyPagination },
  },
  message: dtrLoadUnbalanceDetailsSuccessMessage,
};

/** Live sample — severity=moderate, empty fleet page (Aug 2026). */
export const dtrLoadUnbalanceDetailsContractModerateEmpty: DtrLoadUnbalanceDetailsResponse = {
  success: true,
  data: {
    columns: moderateBalancedColumns,
    rows: [],
    pagination: { ...emptyPagination },
  },
  message: dtrLoadUnbalanceDetailsSuccessMessage,
};

/** Live sample — severity=balanced, empty fleet page (Aug 2026). */
export const dtrLoadUnbalanceDetailsContractBalancedEmpty: DtrLoadUnbalanceDetailsResponse = {
  success: true,
  data: {
    columns: moderateBalancedColumns,
    rows: [],
    pagination: { ...emptyPagination },
  },
  message: dtrLoadUnbalanceDetailsSuccessMessage,
};

/** Contract — severe page with one hydrated hierarchy row. */
export const dtrLoadUnbalanceDetailsContractSevereWithRows: DtrLoadUnbalanceDetailsResponse = {
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
        loadingUnbalance: 42.5,
        ir: 10.1,
        iy: 5.2,
        ib: 1.0,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  },
  message: dtrLoadUnbalanceDetailsSuccessMessage,
};

/**
 * Live sample shape (Aug 2026) — moderate columns + row `id` + band label `<5%`.
 * Fixture keeps the reported pagination totals; row list is a single sample row.
 */
export const dtrLoadUnbalanceDetailsContractModerateWithRows: DtrLoadUnbalanceDetailsResponse = {
  success: true,
  data: {
    columns: moderateBalancedColumns,
    rows: [
      {
        id: "row-1-m-1001",
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "RajMohalla",
        subStation: "Raj Mohalla",
        feeder: "AIR(CHQ)",
        dtr: "RZ8132",
        logDate: "13th Jul 2026, 02:00 AM",
        loadingCondition: "<5%",
        perUB: 1,
        ir: 55.8,
        iy: 70.26,
        loadingUnbalance: 52.8,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 126,
      totalPages: 13,
    },
  },
  message: dtrLoadUnbalanceDetailsSuccessMessage,
};

export interface DtrLoadUnbalanceDetailsTestCase {
  testName: string;
  scenario: DtrLoadUnbalanceDetailsScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function severityForScenario(
  scenario: DtrLoadUnbalanceDetailsScenario,
): DtrLoadUnbalanceSeverity {
  switch (scenario) {
    case "dev_live_moderate":
    case "contract_moderate_empty":
    case "contract_moderate_with_rows":
      return "moderate";
    case "dev_live_balanced":
    case "contract_balanced_empty":
      return "balanced";
    default:
      return "severe";
  }
}

export function resolveDtrLoadUnbalanceDetailsQuery(
  scenario: DtrLoadUnbalanceDetailsScenario,
): DtrLoadUnbalanceDetailsQuery {
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

export function resolveDtrLoadUnbalanceDetailsContractBody(
  scenario: DtrLoadUnbalanceDetailsScenario,
): DtrLoadUnbalanceDetailsResponse | null {
  switch (scenario) {
    case "contract_severe_empty":
      return dtrLoadUnbalanceDetailsContractSevereEmpty;
    case "contract_moderate_empty":
      return dtrLoadUnbalanceDetailsContractModerateEmpty;
    case "contract_balanced_empty":
      return dtrLoadUnbalanceDetailsContractBalancedEmpty;
    case "contract_severe_with_rows":
      return dtrLoadUnbalanceDetailsContractSevereWithRows;
    case "contract_moderate_with_rows":
      return dtrLoadUnbalanceDetailsContractModerateWithRows;
    default:
      return null;
  }
}

export const dtrLoadUnbalanceDetailsTestCases: DtrLoadUnbalanceDetailsTestCase[] = [
  {
    testName: "DTR load unbalance list — severely unbalanced DTRs",
    scenario: "dev_live_severe",
    tags: ["@smoke", "@dashboard", "@dtr-load-unbalance-details"],
    nonEmptyExpected: true,
  },
  {
    testName: "DTR load unbalance list — moderately unbalanced DTRs",
    scenario: "dev_live_moderate",
    tags: ["@dashboard", "@dtr-load-unbalance-details"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR load unbalance list — balanced DTRs",
    scenario: "dev_live_balanced",
    tags: ["@dashboard", "@dtr-load-unbalance-details"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR load unbalance list — page 2 still shows a valid list",
    scenario: "dev_live_page_limit",
    tags: ["@dashboard", "@dtr-load-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR load unbalance list — extra unused filters are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@dashboard", "@dtr-load-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — severe empty page (Aug 2026)",
    scenario: "contract_severe_empty",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-load-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — moderate empty page (Aug 2026)",
    scenario: "contract_moderate_empty",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-load-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — balanced empty page (Aug 2026)",
    scenario: "contract_balanced_empty",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-load-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — severe page with hierarchy row",
    scenario: "contract_severe_with_rows",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-load-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — moderate page with id + band label (Aug 2026)",
    scenario: "contract_moderate_with_rows",
    isContractFixture: true,
    tags: ["@dashboard", "@dtr-load-unbalance-details", "@edge"],
    nonEmptyExpected: false,
  },
];
