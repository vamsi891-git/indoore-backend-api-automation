import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrEventQuery } from "../Api/dtrevent.api";
import type {
    DtrEventResponse,
    DtrEventScenario,
} from "../Mapper/dtrevent.mapper";
import { dtrEventColumnKeys } from "../Mapper/dtrevent.mapper";

export const dtrEventMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrEventDefaultFromDate = "2025-12-12";
export const dtrEventDefaultToDate = "2025-12-12";
export const dtrEventDefaultPage = 1;
export const dtrEventDefaultLimit = 10;

export const dtrEventExpectedColumns = [
    { key: "slNo", header: "SL NO" },
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Substation" },
    { key: "feeder", header: "Feeder" },
    { key: "dt", header: "DTR" },
    { key: "dtrMeterNo", header: "DTR Meter No" },
    { key: "dtrRatingKva", header: "DTR Rating (kVA)" },
    { key: "eventCount", header: "Event Count" },
    { key: "durationHhMmSs", header: "Duration (HH:MM:SS)" },
] as const;

/** Live sample from GET /indore/reports/dtr-event (12 Dec 2025) — scoped total, empty page rows. */
export const dtrEventContractLiveEmptyRowsResponse: DtrEventResponse = {
    success: true,
    data: {
        columns: [...dtrEventExpectedColumns],
        rows: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 5281,
            totalPages: 529,
        },
    },
};

export const dtrEventContractEmptyPageResponse: DtrEventResponse = {
    success: true,
    data: {
        columns: [...dtrEventExpectedColumns],
        rows: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
        },
    },
};

/** Synthetic row for offline row-shape validation when archive events exist. */
export const dtrEventContractSampleRowResponse: DtrEventResponse = {
    success: true,
    data: {
        columns: [...dtrEventExpectedColumns],
        rows: [
            {
                id: "dtr-482910",
                slNo: 1,
                circle: "INDORE URBAN",
                division: "indore central",
                zone: "RAU",
                subStation: "RAU SS",
                feeder: "RAU -2(CHQ)",
                dt: "RU727",
                dtrMeterNo: "19272307",
                dtrRatingKva: 100,
                eventCount: 12,
                durationHhMmSs: "0:32:15",
            },
        ],
        pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
        },
    },
};

export interface DtrEventTestCase {
    testName: string;
    scenario: DtrEventScenario;
    tags: string[];
    isContractFixture?: boolean;
    expectedStatus?: number;
}

export function resolveDtrEventQuery(scenario: DtrEventScenario): DtrEventQuery {
    switch (scenario) {
        case "dev_live_page_beyond":
            return {
                fromDate: dtrEventDefaultFromDate,
                toDate: dtrEventDefaultToDate,
                page: 99,
                limit: dtrEventDefaultLimit,
            };
        case "dev_ignore_unknown_query":
            return {
                fromDate: dtrEventDefaultFromDate,
                toDate: dtrEventDefaultToDate,
                page: dtrEventDefaultPage,
                limit: dtrEventDefaultLimit,
                foo: "bar",
                unused: 1,
            };
        case "invalid_date_range":
            return {
                fromDate: "2025-12-20",
                toDate: "2025-12-10",
                page: dtrEventDefaultPage,
                limit: dtrEventDefaultLimit,
            };
        case "invalid_date_format":
            return {
                fromDate: "not-a-date",
                toDate: dtrEventDefaultToDate,
                page: dtrEventDefaultPage,
                limit: dtrEventDefaultLimit,
            };
        case "missing_from_date":
            return {
                toDate: dtrEventDefaultToDate,
                page: dtrEventDefaultPage,
                limit: dtrEventDefaultLimit,
            };
        case "dev_live_primary":
        case "contract_live_empty_rows":
        case "contract_empty_page":
        case "contract_sample_row":
        default:
            return {
                fromDate: dtrEventDefaultFromDate,
                toDate: dtrEventDefaultToDate,
                page: dtrEventDefaultPage,
                limit: dtrEventDefaultLimit,
            };
    }
}

export function resolveDtrEventContractBody(
    scenario: DtrEventScenario,
): DtrEventResponse | undefined {
    switch (scenario) {
        case "contract_live_empty_rows":
            return dtrEventContractLiveEmptyRowsResponse;
        case "contract_empty_page":
            return dtrEventContractEmptyPageResponse;
        case "contract_sample_row":
            return dtrEventContractSampleRowResponse;
        default:
            return undefined;
    }
}

/** @deprecated Use named exports from this module. */
export const DtrEventData = {
    fromDate: dtrEventDefaultFromDate,
    toDate: dtrEventDefaultToDate,
    page: dtrEventDefaultPage,
    limit: dtrEventDefaultLimit,
    maxResponseTime: dtrEventMaxResponseTimeMs,
    columnKeys: dtrEventColumnKeys,
};

export const dtrEventTestCases: DtrEventTestCase[] = [
    {
        testName:
            "Validate GET /indore/reports/dtr-event — live paginated DTR event summary",
        scenario: "dev_live_primary",
        tags: ["@smoke", "@reports", "@dtr-event"],
    },
    {
        testName:
            "Validate GET /indore/reports/dtr-event — page beyond total returns empty rows",
        scenario: "dev_live_page_beyond",
        tags: ["@reports", "@dtr-event", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/reports/dtr-event — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@reports", "@dtr-event", "@edge"],
    },
    {
        testName:
            "Contract — live DTR event table with empty rows and positive total (12 Dec 2025)",
        scenario: "contract_live_empty_rows",
        isContractFixture: true,
        tags: ["@reports", "@dtr-event", "@edge"],
    },
    {
        testName: "Contract — empty rows with zero pagination total",
        scenario: "contract_empty_page",
        isContractFixture: true,
        tags: ["@reports", "@dtr-event", "@edge"],
    },
    {
        testName:
            "Contract — DTR event row shape with duration HH:MM:SS",
        scenario: "contract_sample_row",
        isContractFixture: true,
        tags: ["@reports", "@dtr-event", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/reports/dtr-event — fromDate after toDate rejected",
        scenario: "invalid_date_range",
        expectedStatus: 400,
        tags: ["@reports", "@dtr-event", "@negative"],
    },
    {
        testName:
            "Validate GET /indore/reports/dtr-event — invalid fromDate rejected",
        scenario: "invalid_date_format",
        expectedStatus: 400,
        tags: ["@reports", "@dtr-event", "@negative"],
    },
    {
        testName:
            "Validate GET /indore/reports/dtr-event — missing fromDate rejected",
        scenario: "missing_from_date",
        expectedStatus: 400,
        tags: ["@reports", "@dtr-event", "@negative"],
    },
];
