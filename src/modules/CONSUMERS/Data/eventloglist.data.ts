import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventLogListQuery } from "../Api/eventloglist.api";
import type {EventLogListResponse,EventLogListScenario,EventLogRow,} from "../Mapper/eventloglist.mapper";
import {
  CONSUMERS_LIVE_IVRS,
  CONSUMERS_LIVE_METER_ROUTE,
  resolveLiveAccountId,
  resolveLiveIvrs,
  resolveLiveMeterRoute,
} from "./consumers-live-refs";
export const eventLogListMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** IVRS from live RTP/PQ sample; archive may return empty list. */
export const eventLogListDefaultIvrs = CONSUMERS_LIVE_IVRS;
export const eventLogListDefaultConsumerId = CONSUMERS_LIVE_IVRS;
export const eventLogListDefaultMeterRoute = CONSUMERS_LIVE_METER_ROUTE;
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
      return resolveLiveIvrs(
        process.env.CONSUMER_ELL_IVRS,
        process.env.CONSUMER_ELC_IVRS,
        process.env.CONSUMER_BH_IVRS,
        eventLogListDefaultIvrs,
      );
    case "ell_by_account":
      return resolveLiveAccountId(
        process.env.CONSUMER_ELL_CONSUMER_ID,
        process.env.CONSUMER_ELC_CONSUMER_ID,
        process.env.CONSUMER_BH_CONSUMER_ID,
        eventLogListDefaultConsumerId,
      );
    case "ell_by_meter":
      return resolveLiveMeterRoute(
        process.env.CONSUMER_ELL_METER_ROUTE,
        process.env.CONSUMER_ELC_METER_ROUTE,
        process.env.CONSUMER_BH_METER_ROUTE,
        process.env.CONSUMER_PROFILE_METER_ROUTE,
        eventLogListDefaultMeterRoute,
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
export function resolveEventLogListQuery(scenario: EventLogListScenario,): EventLogListQuery {
  switch (scenario) {
    case "ell_page_2":
      return { eventPage: 2, eventPageSize: 5 };
    case "ell_with_search":
      return {
        eventPage: 1,
        eventPageSize: 10,
        // Live descriptions are codes like METER_LAST_GASP; "power" matches nothing
        // and the API can leave totalCount unfiltered while returning zero rows.
        eventSearch:
          process.env.CONSUMER_ELL_EVENT_SEARCH?.trim() || "METER",
      };
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
      "Event list — events for the consumer",
    scenario: "ell_by_ivrs",
    tags: ["@smoke", "@consumer", "@event-log", "@event-log-list"],
  },
  {
    testName:
      "Event list — opens using the account number",
    scenario: "ell_by_account",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — opens using the meter",
    scenario: "ell_by_meter",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — page 2 of events loads",
    scenario: "ell_page_2",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — search filter is accepted",
    scenario: "ell_with_search",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — extra unused options are ignored",
    scenario: "ell_ignore_unknown_query",
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — sample: no events",
    scenario: "contract_empty_list",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — sample: page count is correct",
    scenario: "contract_pagination",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — sample: resolved and pending events",
    scenario: "contract_resolved_pending_rows",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-list", "@edge"],
  },
  {
    testName:
      "Event list — unknown consumer is empty or not found",
    scenario: "consumer_not_found",
    tags: ["@consumer", "@event-log", "@event-log-list", "@negative"],
  },
  {
    testName:
      "Event list — unknown meter is empty or not found",
    scenario: "meter_not_found",
    tags: ["@consumer", "@event-log", "@event-log-list", "@negative"],
  },
  {
    testName:
      "Event list — blank consumer number is rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@event-log", "@event-log-list", "@negative"],
  },
];
