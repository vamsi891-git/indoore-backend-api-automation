import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventReportQuery } from "../Api/eventreport.api";
import type {
    EventReportResponse,
    EventReportScenario,
} from "../Mapper/eventreport.mapper";
import { eventReportColumnKeys } from "../Mapper/eventreport.mapper";

export const eventReportMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const eventReportDefaultFromDate = "2025-12-12";
export const eventReportDefaultToDate = "2025-12-12";
export const eventReportDefaultPage = 1;
export const eventReportDefaultLimit = 10;

export const eventReportExpectedColumns = [
    { key: "slNo", header: "SL NO" },
    { key: "circle", header: "Circle" },
    { key: "eventId", header: "Event ID" },
    { key: "eventName", header: "Event Name" },
    { key: "meterCount", header: "Meter Count" },
    { key: "eventCount", header: "Event Count" },
    { key: "durationHhMm", header: "Duration (HH:MM)" },
] as const;

/** Live sample from GET /indore/reports/event-report (12 Dec 2025). */
export const eventReportContractLiveFullResponse: EventReportResponse = {
    success: true,
    data: {
        columns: [...eventReportExpectedColumns],
        rows: [
            {
                id: "row-1",
                circle: "ALL",
                eventId: 547,
                eventName: "B-Phase - Voltage missing",
                meterCount: 5,
                eventCount: 9,
                durationHhMm: "0:05",
                slNo: 1,
            },
            {
                id: "row-2",
                circle: "ALL",
                eventId: 555,
                eventName: "Current bypass",
                meterCount: 63,
                eventCount: 140,
                durationHhMm: "1:53",
                slNo: 2,
            },
            {
                id: "row-3",
                circle: "ALL",
                eventId: 554,
                eventName: "Current unbalance",
                meterCount: 60,
                eventCount: 177,
                durationHhMm: "7434:48",
                slNo: 3,
            },
            {
                id: "row-4",
                circle: "ALL",
                eventId: 528,
                eventName: "Earth loading",
                meterCount: 189,
                eventCount: 413,
                durationHhMm: "33:59",
                slNo: 4,
            },
            {
                id: "row-5",
                circle: "ALL",
                eventId: 537,
                eventName: "Enabled - load limit function",
                meterCount: 1,
                eventCount: 1,
                durationHhMm: "0:00",
                slNo: 5,
            },
            {
                id: "row-6",
                circle: "ALL",
                eventId: 543,
                eventName: "Load Status",
                meterCount: 151,
                eventCount: 158,
                durationHhMm: "41:35",
                slNo: 6,
            },
            {
                id: "row-7",
                circle: "ALL",
                eventId: 569,
                eventName: "Low PF",
                meterCount: 149,
                eventCount: 269,
                durationHhMm: "3:28",
                slNo: 7,
            },
            {
                id: "row-8",
                circle: "ALL",
                eventId: 549,
                eventName: "Low Voltage in any phase",
                meterCount: 162,
                eventCount: 345,
                durationHhMm: "4:19",
                slNo: 8,
            },
            {
                id: "row-9",
                circle: "ALL",
                eventId: 540,
                eventName: "Neutral disturbance",
                meterCount: 23,
                eventCount: 47,
                durationHhMm: "0:54",
                slNo: 9,
            },
            {
                id: "row-10",
                circle: "ALL",
                eventId: 548,
                eventName: "Over Voltage in any phase",
                meterCount: 181,
                eventCount: 559,
                durationHhMm: "4:09",
                slNo: 10,
            },
        ],
        pagination: {
            page: 1,
            limit: 10,
            total: 10,
            totalPages: 1,
        },
    },
};

export const eventReportContractEmptyPageResponse: EventReportResponse = {
    success: true,
    data: {
        columns: [...eventReportExpectedColumns],
        rows: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
        },
    },
};

export interface EventReportTestCase {
    testName: string;
    scenario: EventReportScenario;
    tags: string[];
    isContractFixture?: boolean;
    expectedStatus?: number;
}

export function resolveEventReportQuery(
    scenario: EventReportScenario,
): EventReportQuery {
    switch (scenario) {
        case "dev_live_page2":
            return {
                fromDate: eventReportDefaultFromDate,
                toDate: eventReportDefaultToDate,
                page: 99,
                limit: eventReportDefaultLimit,
            };
        case "dev_ignore_unknown_query":
            return {
                fromDate: eventReportDefaultFromDate,
                toDate: eventReportDefaultToDate,
                page: eventReportDefaultPage,
                limit: eventReportDefaultLimit,
                foo: "bar",
                unused: 1,
            };
        case "invalid_date_range":
            return {
                fromDate: "2025-12-20",
                toDate: "2025-12-10",
                page: eventReportDefaultPage,
                limit: eventReportDefaultLimit,
            };
        case "invalid_date_format":
            return {
                fromDate: "not-a-date",
                toDate: eventReportDefaultToDate,
                page: eventReportDefaultPage,
                limit: eventReportDefaultLimit,
            };
        case "missing_from_date":
            return {
                toDate: eventReportDefaultToDate,
                page: eventReportDefaultPage,
                limit: eventReportDefaultLimit,
            };
        case "dev_live_primary":
        case "contract_live_full":
        case "contract_empty_page":
        default:
            return {
                fromDate: eventReportDefaultFromDate,
                toDate: eventReportDefaultToDate,
                page: eventReportDefaultPage,
                limit: eventReportDefaultLimit,
            };
    }
}

export function resolveEventReportContractBody(
    scenario: EventReportScenario,
): EventReportResponse | undefined {
    switch (scenario) {
        case "contract_live_full":
            return eventReportContractLiveFullResponse;
        case "contract_empty_page":
            return eventReportContractEmptyPageResponse;
        default:
            return undefined;
    }
}

/** @deprecated Use named exports from this module. */
export const EventReportData = {
    fromDate: eventReportDefaultFromDate,
    toDate: eventReportDefaultToDate,
    page: eventReportDefaultPage,
    limit: eventReportDefaultLimit,
    maxResponseTime: eventReportMaxResponseTimeMs,
    columnKeys: eventReportColumnKeys,
};

export const eventReportTestCases: EventReportTestCase[] = [
    {
        testName:
            "Validate GET /indore/reports/event-report — live paginated summary",
        scenario: "dev_live_primary",
        tags: ["@smoke", "@reports", "@event-report"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-report — page beyond total returns empty rows",
        scenario: "dev_live_page2",
        tags: ["@reports", "@event-report", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-report — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@reports", "@event-report", "@edge"],
    },
    {
        testName:
            "Contract — live event summary table (12 Dec 2025)",
        scenario: "contract_live_full",
        isContractFixture: true,
        tags: ["@reports", "@event-report", "@edge"],
    },
    {
        testName: "Contract — empty rows with zero pagination total",
        scenario: "contract_empty_page",
        isContractFixture: true,
        tags: ["@reports", "@event-report", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-report — fromDate after toDate rejected",
        scenario: "invalid_date_range",
        expectedStatus: 400,
        tags: ["@reports", "@event-report", "@negative"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-report — invalid fromDate rejected",
        scenario: "invalid_date_format",
        expectedStatus: 400,
        tags: ["@reports", "@event-report", "@negative"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-report — missing fromDate rejected",
        scenario: "missing_from_date",
        expectedStatus: 400,
        tags: ["@reports", "@event-report", "@negative"],
    },
];
