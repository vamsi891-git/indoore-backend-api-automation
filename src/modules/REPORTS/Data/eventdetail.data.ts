import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventDetailQuery } from "../Api/eventdetail.api";
import type {
    EventDetailResponse,
    EventDetailScenario,
} from "../Mapper/eventdetail.mapper";
import { eventDetailColumnKeys } from "../Mapper/eventdetail.mapper";

export const eventDetailMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const eventDetailDefaultFromDate = "2025-12-12";
export const eventDetailDefaultToDate = "2025-12-12";
export const eventDetailDefaultPage = 1;
export const eventDetailDefaultLimit = 10;

export const eventDetailExpectedColumns = [
    { key: "slNo", header: "SL NO" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "feeder", header: "Feeder" },
    { key: "dtr", header: "DTR" },
    { key: "name", header: "Name" },
    { key: "address", header: "Address" },
    { key: "ivrsNumber", header: "IVRS Number" },
    { key: "tariff", header: "Tariff" },
    { key: "msn", header: "MSN" },
    { key: "phase", header: "Phase" },
    { key: "eventClassificationName", header: "Event Classification" },
    { key: "eventId", header: "Event ID" },
    { key: "eventName", header: "Event Name" },
    { key: "eventCount", header: "Event Count" },
    { key: "durationHhMm", header: "Duration (HH:MM)" },
] as const;

/** Live sample from GET /indore/reports/event-detail (12 Dec 2025). */
export const eventDetailContractLiveFullResponse: EventDetailResponse = {
    success: true,
    data: {
        columns: [...eventDetailExpectedColumns],
        rows: [
            {
                id: "meter-14079200",
                slNo: 1,
                division: "indore central",
                zone: "RAU",
                feeder: "RAU -2(CHQ)",
                dtr: "RU727",
                name: "SMT SHARDA RAM SINGH PARMAR",
                address: "PLOTNO 131 SECTOR B SAI SAGAR COLONY RAURAU",
                ivrsNumber: "3006032142",
                tariff: "LV2.2",
                msn: "14079200",
                phase: "1 PH",
                eventClassificationName: "Class_D1",
                eventId: 529,
                eventName: "Power failure",
                eventCount: 21,
                durationHhMm: "0:32",
            },
            {
                id: "meter-18138951",
                slNo: 2,
                division: "indore west",
                zone: "GPH WEST",
                feeder: "8022731608",
                dtr: "WI588",
                name: "SMT.LAXMIBAI KHIYALDAS",
                address: "..OLD NO.33  NEW NO.119 SADAR BAZAR  MAIN ROAD .",
                ivrsNumber: "N3477009215",
                tariff: "LV2.2",
                msn: "18138951",
                phase: "3PH WC",
                eventClassificationName: "Class_D2",
                eventId: 554,
                eventName: "Current unbalance",
                eventCount: 18,
                durationHhMm: "0:02",
            },
            {
                id: "meter-85093554",
                slNo: 3,
                division: "indore east",
                zone: "KHAJRANA",
                feeder: "8022732704",
                dtr: "IK5727",
                name: "SHEKHAR SHOHARAB",
                address: ".KHAJRANAKHEDI GRAM  KHAJRANA  INDORE.MN.3760641",
                ivrsNumber: "N3374012554",
                tariff: "LV1.2",
                msn: "85093554",
                phase: "1 PH",
                eventClassificationName: "Class_D1",
                eventId: 528,
                eventName: "Earth loading",
                eventCount: 17,
                durationHhMm: "0:22",
            },
            {
                id: "meter-18177351",
                slNo: 4,
                division: "indore west",
                zone: "KALANI NAGAR",
                feeder: "8022732001",
                dtr: "WC2237",
                name: "JATN BAI MOHANLAL JAIN",
                address: "621 KALANI NAGAR621 KALANI NAGAR.",
                ivrsNumber: "N3474013589",
                tariff: "LV2.2",
                msn: "18177351",
                phase: "3PH WC",
                eventClassificationName: "Class_D2",
                eventId: 554,
                eventName: "Current unbalance",
                eventCount: 14,
                durationHhMm: "5:22",
            },
            {
                id: "meter-18176303",
                slNo: 5,
                division: "indore south",
                zone: "OPH SOUTH",
                feeder: "8022731903",
                dtr: "24SE11",
                name: "MS FENA STEEL",
                address: "32 CHAMPA BAGH INDOREINDORE",
                ivrsNumber: "N3544023897",
                tariff: "LV4.1A",
                msn: "18176303",
                phase: "3PH WC",
                eventClassificationName: "Class_D2",
                eventId: 569,
                eventName: "Low PF",
                eventCount: 14,
                durationHhMm: "0:04",
            },
            {
                id: "meter-19280060",
                slNo: 6,
                division: "",
                zone: "",
                feeder: "",
                dtr: "",
                name: "",
                address: "",
                ivrsNumber: "",
                tariff: "",
                msn: "19280060",
                phase: "3PH WC",
                eventClassificationName: "Class_D2",
                eventId: 555,
                eventName: "Current bypass",
                eventCount: 13,
                durationHhMm: "0:29",
            },
            {
                id: "meter-19272455",
                slNo: 7,
                division: "indore south",
                zone: "University",
                feeder: "KRISHNA PULSES(INDUSTRIAL)",
                dtr: "RJ6612",
                name: "RISHI",
                address: "307/1/1PALDA INDOREINDORE",
                ivrsNumber: "N3543023977",
                tariff: "LV4.1A",
                msn: "19272455",
                phase: "3PH 4CT",
                eventClassificationName: "Class_D2",
                eventId: 553,
                eventName: "Phase B - Current reverse",
                eventCount: 13,
                durationHhMm: "0:09",
            },
            {
                id: "meter-85081114",
                slNo: 8,
                division: "indore central",
                zone: "RAJ MOHALLA",
                feeder: "8022732006",
                dtr: "RZ8110",
                name: "BRAJBALA SURESHCHANDRA NEEMA",
                address: "..180/A BHAKT PRAHLAD NAGAR  --.",
                ivrsNumber: "N3004001997",
                tariff: "LV1.2",
                msn: "85081114",
                phase: "1 PH",
                eventClassificationName: "Class_D1",
                eventId: 528,
                eventName: "Earth loading",
                eventCount: 13,
                durationHhMm: "0:09",
            },
            {
                id: "meter-18139116",
                slNo: 9,
                division: "",
                zone: "",
                feeder: "E.W.S.(CHQ)",
                dtr: "ML813",
                name: "ACHIVERS TENIS ACADEMY SUYASH VARDHAN SHARMA",
                address:
                    "ACHIVARS TENIS ACADEMY BELMORPARK KE PICHHE RUCHI SOYAVATER PAMP KE PAS INDORE",
                ivrsNumber: "3962037169",
                tariff: "LV2.T",
                msn: "18139116",
                phase: "3PH WC",
                eventClassificationName: "Class_D2",
                eventId: 569,
                eventName: "Low PF",
                eventCount: 13,
                durationHhMm: "0:04",
            },
            {
                id: "meter-85084432",
                slNo: 10,
                division: "indore central",
                zone: "RAJ MOHALLA",
                feeder: "MHOW(CHQ)",
                dtr: "RZ817",
                name: "KISHANRAO SHANKARRAO",
                address: "12/7 D MOG LINE ..12/7 D MOG LINE ..12/7 D MOG LINE ..",
                ivrsNumber: "N3004015448",
                tariff: "LV1.2",
                msn: "85084432",
                phase: "1 PH",
                eventClassificationName: "Class_D1",
                eventId: 530,
                eventName: "Real time clock, date and time",
                eventCount: 13,
                durationHhMm: "NA",
            },
        ],
        pagination: {
            page: 1,
            limit: 10,
            total: 2825,
            totalPages: 283,
        },
    },
};

export const eventDetailContractEmptyPageResponse: EventDetailResponse = {
    success: true,
    data: {
        columns: [...eventDetailExpectedColumns],
        rows: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
        },
    },
};

export interface EventDetailTestCase {
    testName: string;
    scenario: EventDetailScenario;
    tags: string[];
    isContractFixture?: boolean;
    expectedStatus?: number;
}

export function resolveEventDetailQuery(
    scenario: EventDetailScenario,
): EventDetailQuery {
    switch (scenario) {
        case "dev_live_page_beyond":
            return {
                fromDate: eventDetailDefaultFromDate,
                toDate: eventDetailDefaultToDate,
                page: 99,
                limit: eventDetailDefaultLimit,
            };
        case "dev_ignore_unknown_query":
            return {
                fromDate: eventDetailDefaultFromDate,
                toDate: eventDetailDefaultToDate,
                page: eventDetailDefaultPage,
                limit: eventDetailDefaultLimit,
                foo: "bar",
                unused: 1,
            };
        case "invalid_date_range":
            return {
                fromDate: "2025-12-20",
                toDate: "2025-12-10",
                page: eventDetailDefaultPage,
                limit: eventDetailDefaultLimit,
            };
        case "invalid_date_format":
            return {
                fromDate: "not-a-date",
                toDate: eventDetailDefaultToDate,
                page: eventDetailDefaultPage,
                limit: eventDetailDefaultLimit,
            };
        case "missing_from_date":
            return {
                toDate: eventDetailDefaultToDate,
                page: eventDetailDefaultPage,
                limit: eventDetailDefaultLimit,
            };
        case "dev_live_primary":
        case "contract_live_full":
        case "contract_empty_page":
        default:
            return {
                fromDate: eventDetailDefaultFromDate,
                toDate: eventDetailDefaultToDate,
                page: eventDetailDefaultPage,
                limit: eventDetailDefaultLimit,
            };
    }
}

export function resolveEventDetailContractBody(
    scenario: EventDetailScenario,
): EventDetailResponse | undefined {
    switch (scenario) {
        case "contract_live_full":
            return eventDetailContractLiveFullResponse;
        case "contract_empty_page":
            return eventDetailContractEmptyPageResponse;
        default:
            return undefined;
    }
}

/** @deprecated Use named exports from this module. */
export const EventDetailData = {
    fromDate: eventDetailDefaultFromDate,
    toDate: eventDetailDefaultToDate,
    page: eventDetailDefaultPage,
    limit: eventDetailDefaultLimit,
    maxResponseTime: eventDetailMaxResponseTimeMs,
    columnKeys: eventDetailColumnKeys,
};

export const eventDetailTestCases: EventDetailTestCase[] = [
    {
        testName:
            "Validate GET /indore/reports/event-detail — live paginated meter events",
        scenario: "dev_live_primary",
        tags: ["@smoke", "@reports", "@event-detail"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-detail — page beyond total returns empty rows",
        scenario: "dev_live_page_beyond",
        tags: ["@reports", "@event-detail", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-detail — unknown query params ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@reports", "@event-detail", "@edge"],
    },
    {
        testName:
            "Contract — live event detail table (12 Dec 2025)",
        scenario: "contract_live_full",
        isContractFixture: true,
        tags: ["@reports", "@event-detail", "@edge"],
    },
    {
        testName: "Contract — empty rows with zero pagination total",
        scenario: "contract_empty_page",
        isContractFixture: true,
        tags: ["@reports", "@event-detail", "@edge"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-detail — fromDate after toDate rejected",
        scenario: "invalid_date_range",
        expectedStatus: 400,
        tags: ["@reports", "@event-detail", "@negative"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-detail — invalid fromDate rejected",
        scenario: "invalid_date_format",
        expectedStatus: 400,
        tags: ["@reports", "@event-detail", "@negative"],
    },
    {
        testName:
            "Validate GET /indore/reports/event-detail — missing fromDate rejected",
        scenario: "missing_from_date",
        expectedStatus: 400,
        tags: ["@reports", "@event-detail", "@negative"],
    },
];
