import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrFeedersQuery } from "../Api/dtrfeeders.api";
import type {
  DtrFeedersResponse,
  DtrFeedersScenario,
  FeederItem,
} from "../Mapper/dtrfeeders.mapper";

export const dtrFeedersMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** User-provided live DTR code (empty LT feeders list). */
export const dtrFeedersDefaultCode = "11IW3";

export const dtrFeedersAltCode = "34SO21";

export const dtrFeedersNotFoundCode = "INVALID_DTR_XYZ";

export const dtrFeedersEmptyCode = " ";

export const dtrFeedersAllowedStatuses = ["Active", "Inactive"] as const;

export const dtrFeedersFields = [
  "id",
  "name",
  "status",
  "lastCommunication",
] as const;

/** Live sample for GET /indore/dtr/11IW3/feeders — no LT feeder descendants. */
export const dtrFeedersContractEmptyResponse: DtrFeedersResponse = {
  success: true,
  data: {
    feeders: [],
  },
};

/** Populated LT feeders under DTR (Network_Code as id). */
export const dtrFeedersContractPopulatedResponse: DtrFeedersResponse = {
  success: true,
  data: {
    feeders: [
      {
        id: "LT-FDR-001",
        name: "LT Feeder Alpha",
        status: "Active",
        lastCommunication: null,
      },
      {
        id: "LT-FDR-002",
        name: "LT Feeder Beta",
        status: "Active",
        lastCommunication: "09-07-2026 14:30:15",
      },
      {
        id: "LT-FDR-003",
        name: "LT Feeder Gamma",
        status: "Inactive",
        lastCommunication: null,
      },
    ],
  },
};

/** IsActiveStatus mapping — Active and Inactive rows. */
export const dtrFeedersContractMixedStatusesResponse: DtrFeedersResponse = {
  success: true,
  data: {
    feeders: [
      {
        id: "FDR-A",
        name: "Active Feeder",
        status: "Active",
        lastCommunication: null,
      },
      {
        id: "FDR-I",
        name: null,
        status: "Inactive",
        lastCommunication: null,
      },
    ],
  },
};

/** id = String(NetworkLookup_TblRefID) when Network_Code is empty. */
export const dtrFeedersContractNumericIdResponse: DtrFeedersResponse = {
  success: true,
  data: {
    feeders: [
      {
        id: "987654",
        name: "Unnamed Feeder Network",
        status: "Active",
        lastCommunication: null,
      },
    ],
  },
};

/** formatIsoToIstDateTime on feeder meter LastCommunication. */
export const dtrFeedersContractWithCommunicationResponse: DtrFeedersResponse = {
  success: true,
  data: {
    feeders: [
      {
        id: "COMM-01",
        name: "Communicating Feeder",
        status: "Active",
        lastCommunication: "09-07-2026 08:45:00",
      },
      {
        id: "COMM-02",
        name: "Silent Feeder",
        status: "Active",
        lastCommunication: null,
      },
    ],
  },
};

export interface DtrFeedersTestCase {
  testName: string;
  scenario: DtrFeedersScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveDtrFeedersCode(
  scenario: DtrFeedersScenario,
): string | undefined {
  switch (scenario) {
    case "dfe_by_code_primary":
    case "dfe_ignore_unknown_query":
      return (
        process.env.DTR_FEEDERS_CODE?.trim() ||
        process.env.DTR_PROFILE_CODE?.trim() ||
        process.env.DTR_CAPACITY_GAUGE_CODE?.trim() ||
        dtrFeedersDefaultCode
      );
    case "dfe_by_code_alt":
      return (
        process.env.DTR_FEEDERS_CODE_ALT?.trim() ||
        process.env.DTR_PROFILE_CODE_ALT?.trim() ||
        dtrFeedersAltCode
      );
    case "dtr_not_found":
      return dtrFeedersNotFoundCode;
    case "empty_dtr_code":
      return dtrFeedersEmptyCode;
    case "contract_empty_feeders":
    case "contract_populated_feeders":
    case "contract_mixed_statuses":
    case "contract_numeric_id_fallback":
    case "contract_with_communication":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveDtrFeedersQuery(
  scenario: DtrFeedersScenario,
): DtrFeedersQuery {
  if (scenario === "dfe_ignore_unknown_query") {
    return { foo: 1, bar: "baz" };
  }
  return {};
}

export function resolveDtrFeedersContractBody(
  scenario: DtrFeedersScenario,
): DtrFeedersResponse | undefined {
  switch (scenario) {
    case "contract_empty_feeders":
      return dtrFeedersContractEmptyResponse;
    case "contract_populated_feeders":
      return dtrFeedersContractPopulatedResponse;
    case "contract_mixed_statuses":
      return dtrFeedersContractMixedStatusesResponse;
    case "contract_numeric_id_fallback":
      return dtrFeedersContractNumericIdResponse;
    case "contract_with_communication":
      return dtrFeedersContractWithCommunicationResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use resolveDtrFeedersCode — kept for backward compatibility. */
export const dtrFeedersData = {
  dtrCode: dtrFeedersDefaultCode,
  allowedStatuses: dtrFeedersAllowedStatuses,
  feederFields: dtrFeedersFields,
};

export const dtrFeedersTestCases: DtrFeedersTestCase[] = [
  {
    testName:
      "Validate GET /indore/dtr/{code}/feeders — primary DTR (11IW3) LT feeders",
    scenario: "dfe_by_code_primary",
    tags: ["@smoke", "@dtr", "@feeders"],
  },
  {
    testName: "Validate GET /indore/dtr/{code}/feeders — alternate DTR code",
    scenario: "dfe_by_code_alt",
    tags: ["@dtr", "@feeders", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/feeders — unknown query params ignored",
    scenario: "dfe_ignore_unknown_query",
    tags: ["@dtr", "@feeders", "@edge"],
  },
  {
    testName:
      "Contract — empty feeders array when no LT feeder descendants (11IW3)",
    scenario: "contract_empty_feeders",
    isContractFixture: true,
    tags: ["@dtr", "@feeders", "@edge"],
  },
  {
    testName:
      "Contract — populated feeders with id, name, status, lastCommunication",
    scenario: "contract_populated_feeders",
    isContractFixture: true,
    tags: ["@dtr", "@feeders", "@edge"],
  },
  {
    testName:
      "Contract — Active/Inactive status from IsActiveStatus",
    scenario: "contract_mixed_statuses",
    isContractFixture: true,
    tags: ["@dtr", "@feeders", "@edge"],
  },
  {
    testName:
      "Contract — feeder id falls back to NetworkLookup_TblRefID string",
    scenario: "contract_numeric_id_fallback",
    isContractFixture: true,
    tags: ["@dtr", "@feeders", "@edge"],
  },
  {
    testName:
      "Contract — lastCommunication IST formatted or null",
    scenario: "contract_with_communication",
    isContractFixture: true,
    tags: ["@dtr", "@feeders", "@edge"],
  },
  {
    testName: "Validate GET /indore/dtr/{code}/feeders — DTR not found",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@feeders", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/feeders — blank DTR code rejected",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@feeders", "@negative"],
  },
];
