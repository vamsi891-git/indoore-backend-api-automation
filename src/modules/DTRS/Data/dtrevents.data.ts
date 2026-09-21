import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrEventsQuery } from "../Api/dtrevents.api";
import type { DtrEventsResponse, DtrEventsScenario } from "../Mapper/dtrevents.mapper";

export const dtrEventsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** User-provided live DTR code (empty event log). */
export const dtrEventsDefaultCode = "10IW27";

export const dtrEventsAltCode = "34SO21";

export const dtrEventsNotFoundCode = "INVALID_DTR_XYZ";

export const dtrEventsEmptyCode = " ";

export const dtrEventsDefaultPage = 1;

export const dtrEventsDefaultLimit = 20;

export const dtrEventsAllowedStatuses = ["Resolved", "Pending"] as const;

export const dtrEventsDataFields = [
  "rows",
  "page",
  "pageSize",
  "totalCount",
  "totalPages",
] as const;

export const dtrEventsRowFields = [
  "serialNo",
  "meterSlNo",
  "eventDateTime",
  "restoredDateTime",
  "description",
  "duration",
  "status",
] as const;

/** Live sample for GET /indore/dtr/10IW27/events?page=1&limit=20. */
export const dtrEventsContractEmptyResponse: DtrEventsResponse = {
  success: true,
  data: {
    rows: [],
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  },
};

/** durationSeconds > 0 → Resolved with restore time and human duration. */
export const dtrEventsContractResolvedResponse: DtrEventsResponse = {
  success: true,
  data: {
    rows: [
      {
        serialNo: 1,
        meterSlNo: "19272307",
        eventDateTime: "09-07-2026 14:30:15",
        restoredDateTime: "09-07-2026 14:35:25",
        description: "Power failure",
        duration: "5m 10s",
        status: "Resolved",
      },
    ],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
  },
};

/** durationSeconds null → Pending, restoredDateTime null. */
export const dtrEventsContractPendingResponse: DtrEventsResponse = {
  success: true,
  data: {
    rows: [
      {
        serialNo: 1,
        meterSlNo: "19272307",
        eventDateTime: "08-07-2026 10:00:00",
        restoredDateTime: null,
        description: "Voltage failure",
        duration: null,
        status: "Pending",
      },
    ],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
  },
};

/** serialNo = offset + idx + 1 on page 2. */
export const dtrEventsContractPageTwoResponse: DtrEventsResponse = {
  success: true,
  data: {
    rows: [
      {
        serialNo: 21,
        meterSlNo: "19272307",
        eventDateTime: "07-07-2026 09:15:00",
        restoredDateTime: "07-07-2026 09:20:00",
        description: "Meter event",
        duration: "5m 0s",
        status: "Resolved",
      },
    ],
    page: 2,
    pageSize: 20,
    totalCount: 25,
    totalPages: 2,
  },
};

export interface DtrEventsTestCase {
  testName: string;
  scenario: DtrEventsScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveDtrEventsCode(scenario: DtrEventsScenario): string | undefined {
  switch (scenario) {
    case "dev_by_code_primary":
    case "dev_page_two":
    case "dev_custom_limit":
    case "dev_ignore_unknown_query":
    case "dev_with_search_query":
      return (
        process.env.DTR_EVENTS_CODE?.trim() ||
        process.env.DTR_STATS_CODE?.trim() ||
        dtrEventsDefaultCode
      );
    case "dev_by_code_alt":
      return (
        process.env.DTR_EVENTS_CODE_ALT?.trim() ||
        process.env.DTR_STATS_CODE_ALT?.trim() ||
        dtrEventsAltCode
      );
    case "dtr_not_found":
      return dtrEventsNotFoundCode;
    case "empty_dtr_code":
      return dtrEventsEmptyCode;
    case "invalid_page":
      return (
        process.env.DTR_EVENTS_CODE?.trim() ||
        process.env.DTR_STATS_CODE?.trim() ||
        dtrEventsDefaultCode
      );
    case "contract_empty_page":
    case "contract_resolved_row":
    case "contract_pending_row":
    case "contract_pagination_page_two":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveDtrEventsQuery(scenario: DtrEventsScenario): DtrEventsQuery {
  switch (scenario) {
    case "dev_page_two":
    case "contract_pagination_page_two":
      return { page: 2, limit: dtrEventsDefaultLimit };
    case "dev_custom_limit":
      return { page: 1, limit: 5 };
    case "dev_with_search_query":
      return { page: 1, limit: dtrEventsDefaultLimit, q: "power" };
    case "dev_ignore_unknown_query":
      return {
        page: dtrEventsDefaultPage,
        limit: dtrEventsDefaultLimit,
        foo: 1,
        bar: "baz",
      };
    case "invalid_page":
      return { page: 0, limit: dtrEventsDefaultLimit };
    case "contract_resolved_row":
    case "contract_pending_row":
    case "contract_empty_page":
      return { page: 1, limit: 20 };
    case "dev_by_code_alt":
    case "dev_by_code_primary":
    case "dtr_not_found":
    case "empty_dtr_code":
    default:
      return { page: dtrEventsDefaultPage, limit: dtrEventsDefaultLimit };
  }
}

export function resolveDtrEventsContractBody(
  scenario: DtrEventsScenario,
): DtrEventsResponse | undefined {
  switch (scenario) {
    case "contract_empty_page":
      return dtrEventsContractEmptyResponse;
    case "contract_resolved_row":
      return dtrEventsContractResolvedResponse;
    case "contract_pending_row":
      return dtrEventsContractPendingResponse;
    case "contract_pagination_page_two":
      return dtrEventsContractPageTwoResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use resolveDtrEventsCode — kept for backward compatibility. */
export const dtrEventsData = {
  dtrCode: dtrEventsDefaultCode,
  page: dtrEventsDefaultPage,
  limit: dtrEventsDefaultLimit,
  maxResponseTime: dtrEventsMaxResponseTimeMs,
  allowedStatuses: dtrEventsAllowedStatuses,
  dataFields: dtrEventsDataFields,
  rowFields: dtrEventsRowFields,
};

export const dtrEventsTestCases: DtrEventsTestCase[] = [
  {
    testName: "DTR events — first page of alarms, each row number only once",
    scenario: "dev_by_code_primary",
    tags: ["@smoke", "@dtr", "@dtr-events"],
    nonEmptyExpected: true,
  },
  {
    testName: "DTR events — a second transformer still shows events",
    scenario: "dev_by_code_alt",
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR events — page two of the list",
    scenario: "dev_page_two",
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR events — show five events at a time",
    scenario: "dev_custom_limit",
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR events — extra filters that nobody uses are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR events — search box text is accepted",
    scenario: "dev_with_search_query",
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample events — none yet is allowed",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample events — resolved alarm with restore time",
    scenario: "contract_resolved_row",
    isContractFixture: true,
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample events — pending alarm without restore time",
    scenario: "contract_pending_row",
    isContractFixture: true,
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Sample events — page two numbering continues from page one",
    scenario: "contract_pagination_page_two",
    isContractFixture: true,
    tags: ["@dtr", "@dtr-events", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR events — unknown transformer is not shown",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@dtr-events", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR events — a blank transformer code is not allowed",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@dtr-events", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "DTR events — page zero is not allowed",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@dtr", "@dtr-events", "@negative"],
    nonEmptyExpected: false,
  },
];
