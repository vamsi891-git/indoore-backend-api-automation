import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventLogListQuery } from "../Api/eventloglist.api";
import type {
  EventLogListResponse,
  EventLogListScenario,
  EventLogRow,
} from "../Mapper/eventloglist.mapper";

export const eventLogListMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** IVRS from user request; live archive may return empty list. */
export const eventLogListDefaultIvrs = "N3374018980";

export const eventLogListDefaultConsumerId = "N3374018980";

export const eventLogListDefaultMeterRoute = "meter-12345";

export const eventLogListNotFoundRef = "INVALID_CONSUMER_XYZ";

export const eventLogListMeterNotFoundRef = "meter-999999999";

export const eventLogListEmptyRef = " ";

export const eventLogListDefaultPage = 1;

export const eventLogListDefaultPageSize = 10;

/** Mirrors backend getEmptyEventLogPage(page, pageSize). */
export const eventLogListContractEmptyResponse: EventLogListResponse = {
  success: true,
  data: {
    rows: [],
    page: eventLogListDefaultPage,
    pageSize: eventLogListDefaultPageSize,
    totalCount: 0,
    totalPages: 0,
  },
};

export const eventLogListContractPaginationMeta = {
  page: 2,
  pageSize: 10,
  totalCount: 25,
  expectedTotalPages: 3,
  expectedSerialStart: 11,
};

const contractPaginationRows: EventLogRow[] = Array.from(
  { length: 5 },
  (_, index) => ({
    serialNo: eventLogListContractPaginationMeta.expectedSerialStart + index,
    meterNo: "MSN-CONTRACT-001",
    occurDateTime: `0${9 - index}-07-2026 12:0${index}:00`,
    restoreDateTime: null,
    description: `Event ${index + 1}`,
    durationDisplay: null,
    status: "Pending" as const,
  }),
);

export const eventLogListContractPaginationResponse: EventLogListResponse = {
  success: true,
  data: {
    rows: contractPaginationRows,
    page: eventLogListContractPaginationMeta.page,
    pageSize: eventLogListContractPaginationMeta.pageSize,
    totalCount: eventLogListContractPaginationMeta.totalCount,
    totalPages: eventLogListContractPaginationMeta.expectedTotalPages,
  },
};

export const eventLogListContractResolvedPendingRows: EventLogRow[] = [
  {
    serialNo: 1,
    meterNo: "MSN-CONTRACT-001",
    occurDateTime: "09-07-2026 10:30:00",
    restoreDateTime: "09-07-2026 10:35:00",
    description: "Power Failure",
    durationDisplay: "5m",
    status: "Resolved",
  },
  {
    serialNo: 2,
    meterNo: "MSN-CONTRACT-001",
    occurDateTime: "08-07-2026 14:00:00",
    restoreDateTime: null,
    description: "Voltage Sag",
    durationDisplay: null,
    status: "Pending",
  },
];

export const eventLogListContractResolvedPendingResponse: EventLogListResponse = {
  success: true,
  data: {
    rows: eventLogListContractResolvedPendingRows,
    page: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
  },
};

export interface EventLogListTestCase {
  testName: string;
  scenario: EventLogListScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveEventLogListRef(
  scenario: EventLogListScenario,
): string | undefined {
  switch (scenario) {
    case "ell_by_ivrs":
    case "ell_page_2":
    case "ell_with_search":
    case "ell_ignore_unknown_query":
      return (
        process.env.CONSUMER_ELL_IVRS?.trim() ||
        process.env.CONSUMER_ELC_IVRS?.trim() ||
        process.env.CONSUMER_BH_IVRS?.trim() ||
        eventLogListDefaultIvrs
      );
    case "ell_by_account":
      return (
        process.env.CONSUMER_ELL_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_ELC_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_BH_CONSUMER_ID?.trim() ||
        eventLogListDefaultConsumerId
      );
    case "ell_by_meter":
      return (
        process.env.CONSUMER_ELL_METER_ROUTE?.trim() ||
        process.env.CONSUMER_ELC_METER_ROUTE?.trim() ||
        process.env.CONSUMER_BH_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        eventLogListDefaultMeterRoute
      );
    case "consumer_not_found":
      return eventLogListNotFoundRef;
    case "meter_not_found":
      return eventLogListMeterNotFoundRef;
    case "empty_consumer_ref":
      return eventLogListEmptyRef;
    case "contract_empty_list":
    case "contract_pagination":
    case "contract_resolved_pending_rows":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveEventLogListQuery(
  scenario: EventLogListScenario,
): EventLogListQuery {
  switch (scenario) {
    case "ell_page_2":
      return { eventPage: 2, eventPageSize: 5 };
    case "ell_with_search":
      return { eventPage: 1, eventPageSize: 10, eventSearch: "power" };
    case "ell_ignore_unknown_query":
      return { eventPage: 1, eventPageSize: 10, foo: 1 };
    case "contract_pagination":
      return {
        eventPage: eventLogListContractPaginationMeta.page,
        eventPageSize: eventLogListContractPaginationMeta.pageSize,
      };
    default:
      return {
        eventPage: eventLogListDefaultPage,
        eventPageSize: eventLogListDefaultPageSize,
      };
  }
}

export function resolveEventLogListContractBody(
  scenario: EventLogListScenario,
): EventLogListResponse | undefined {
  switch (scenario) {
    case "contract_empty_list":
      return eventLogListContractEmptyResponse;
    case "contract_pagination":
      return eventLogListContractPaginationResponse;
    case "contract_resolved_pending_rows":
      return eventLogListContractResolvedPendingResponse;
    default:
      return undefined;
  }
}

export const eventLogListTestCases: EventLogListTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/event-log/list — success with paginated rows",
    scenario: "ell_by_ivrs",
    tags: ["@smoke", "@consumer", "@event-log", "@event-log-list"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/event-log/list — resolve by account id",
    scenario: "ell_by_account",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/event-log/list — resolve by meter lookup id",
    scenario: "ell_by_meter",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/event-log/list — page 2 echoes query params",
    scenario: "ell_page_2",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/event-log/list — eventSearch filter accepted",
    scenario: "ell_with_search",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/event-log/list — unknown query params ignored",
    scenario: "ell_ignore_unknown_query",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Contract — empty list (getEmptyEventLogPage backend fallback)",
    scenario: "contract_empty_list",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Contract — pagination math totalPages = ceil(totalCount / pageSize)",
    scenario: "contract_pagination",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Contract — Resolved vs Pending row rules (restoreDateTime, status)",
    scenario: "contract_resolved_pending_rows",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/event-log/list — consumer not found or empty list",
    scenario: "consumer_not_found",
    tags: ["@consumer", "@event-log", "@event-log-list", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/event-log/list — unknown meter not found or empty list",
    scenario: "meter_not_found",
    tags: ["@consumer", "@event-log", "@event-log-list", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/event-log/list — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@event-log", "@event-log-list", "@negative"],
  },
];
