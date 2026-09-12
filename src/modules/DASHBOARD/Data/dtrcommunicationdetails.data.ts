import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrCommunicationDetailsQuery } from "../Api/dtrcommunicationdetails.api";
import type {
    DtrCommunicationDetailsResponse,
    DtrCommunicationDetailsScenario,
    DtrCommunicationDetailsStatus,
} from "../Mapper/dtrcommunicationdetails.mapper";

export const dtrCommunicationDetailsMaxResponseTimeMs =
    MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrCommunicationDetailsSuccessMessage =
    "DTR communication details fetched successfully.";

export {
    dtrUnbalanceUnauthorizedMessage as dtrCommunicationDetailsUnauthorizedMessage,
    dtrUnbalanceAccessTokenInvalidMessage as dtrCommunicationDetailsAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Fixed column set for communicated / non-communicated (live samples Aug 2026). */
export const DTR_COMMUNICATION_DETAILS_COLUMN_KEYS = [
    "circle",
    "division",
    "zone",
    "subStation",
    "feeder",
    "dtr",
    "msn",
    "lastSeen",
    "status",
] as const;

const communicationDetailsColumns = [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Sub Station" },
    { key: "feeder", header: "Feeder" },
    { key: "dtr", header: "DTR" },
    { key: "msn", header: "MSN" },
    { key: "lastSeen", header: "Log Date" },
    { key: "status", header: "Status" },
];

const emptyPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

export const dtrCommunicationDetailsContractCommunicatedEmpty: DtrCommunicationDetailsResponse =
    {
        success: true,
        data: {
            columns: communicationDetailsColumns,
            rows: [],
            pagination: { ...emptyPagination },
        },
        message: dtrCommunicationDetailsSuccessMessage,
    };

export const dtrCommunicationDetailsContractNonCommunicatedEmpty: DtrCommunicationDetailsResponse =
    {
        success: true,
        data: {
            columns: communicationDetailsColumns,
            rows: [],
            pagination: { ...emptyPagination },
        },
        message: dtrCommunicationDetailsSuccessMessage,
    };

/**
 * Live sample shape — status=non-communicated with hierarchy + MSN rows.
 * Fixture keeps reported pagination totals; row list is a single sample row.
 */
export const dtrCommunicationDetailsContractNonCommunicatedWithRows: DtrCommunicationDetailsResponse =
    {
        success: true,
        data: {
            columns: communicationDetailsColumns,
            rows: [
                {
                    id: "meter-19271515",
                    circle: "Indore city circle",
                    division: "WEST",
                    zone: "GPH",
                    subStation: "PARMANU NAGAR(CHQ)",
                    feeder: "RJ665",
                    dtr: "10IW1",
                    msn: "19271515",
                    lastSeen: null,
                    status: "Non-Communicating",
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1134,
                totalPages: 114,
            },
        },
        message: dtrCommunicationDetailsSuccessMessage,
    };

/** Contract — status=communicated with one row (lastSeen present). */
export const dtrCommunicationDetailsContractCommunicatedWithRows: DtrCommunicationDetailsResponse =
    {
        success: true,
        data: {
            columns: communicationDetailsColumns,
            rows: [
                {
                    id: "meter-19279999",
                    circle: "Indore city circle",
                    division: "WEST",
                    zone: "GPH",
                    subStation: "AIR(CHQ)",
                    feeder: "RZ8134",
                    dtr: "11IW9",
                    msn: "19279999",
                    lastSeen: "13th Jul 2026, 02:00 AM",
                    status: "Communicated",
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        },
        message: dtrCommunicationDetailsSuccessMessage,
    };

export interface DtrCommunicationDetailsTestCase {
    testName: string;
    scenario: DtrCommunicationDetailsScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function statusForScenario(
    scenario: DtrCommunicationDetailsScenario,
): DtrCommunicationDetailsStatus {
    switch (scenario) {
        case "dev_live_communicated":
        case "contract_communicated_empty":
        case "contract_communicated_with_rows":
            return "communicated";
        default:
            return "non-communicated";
    }
}

export function resolveDtrCommunicationDetailsQuery(
    scenario: DtrCommunicationDetailsScenario,
): DtrCommunicationDetailsQuery {
    const status = statusForScenario(scenario);
    switch (scenario) {
        case "dev_live_page_limit":
            return { status, page: 1, limit: 5 };
        case "dev_ignore_unknown_query":
            return { status, page: 1, limit: 10, foo: "bar" };
        case "dev_reject_legacy_status":
            // Chart uses communicating/nonCommunicating; details enum is communicated|non-communicated.
            return {
                status: "communicating" as DtrCommunicationDetailsStatus,
                page: 1,
                limit: 10,
            };
        default:
            return { status, page: 1, limit: 10 };
    }
}

export function resolveDtrCommunicationDetailsContractBody(
    scenario: DtrCommunicationDetailsScenario,
): DtrCommunicationDetailsResponse | null {
    switch (scenario) {
        case "contract_communicated_empty":
            return dtrCommunicationDetailsContractCommunicatedEmpty;
        case "contract_non_communicated_empty":
            return dtrCommunicationDetailsContractNonCommunicatedEmpty;
        case "contract_non_communicated_with_rows":
            return dtrCommunicationDetailsContractNonCommunicatedWithRows;
        case "contract_communicated_with_rows":
            return dtrCommunicationDetailsContractCommunicatedWithRows;
        default:
            return null;
    }
}

export const dtrCommunicationDetailsTestCases: DtrCommunicationDetailsTestCase[] =
    [
        {
            testName: "DTR communication list — meters that are not communicating",
            scenario: "dev_live_non_communicated",
            tags: ["@smoke", "@dashboard", "@dtr-communication-details"],
        },
        {
            testName: "DTR communication list — meters that are communicating",
            scenario: "dev_live_communicated",
            tags: ["@dashboard", "@dtr-communication-details"],
        },
        {
            testName: "DTR communication list — page 2 still shows a valid list",
            scenario: "dev_live_page_limit",
            tags: ["@dashboard", "@dtr-communication-details", "@edge"],
        },
        {
            testName: "DTR communication list — extra unused filters are ignored",
            scenario: "dev_ignore_unknown_query",
            tags: ["@dashboard", "@dtr-communication-details", "@edge"],
        },
        {
            testName: "DTR communication list — old communicating status is rejected",
            scenario: "dev_reject_legacy_status",
            expectedStatus: 400,
            tags: [
                "@negative",
                "@dashboard",
                "@dtr-communication-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — meters that are communicating empty page",
            scenario: "contract_communicated_empty",
            isContractFixture: true,
            tags: ["@dashboard", "@dtr-communication-details", "@edge"],
        },
        {
            testName: "Saved example — meters that are not communicating empty page",
            scenario: "contract_non_communicated_empty",
            isContractFixture: true,
            tags: ["@dashboard", "@dtr-communication-details", "@edge"],
        },
        {
            testName: "Saved example — meters that are not communicating with rows (total 1134)",
            scenario: "contract_non_communicated_with_rows",
            isContractFixture: true,
            tags: ["@dashboard", "@dtr-communication-details", "@edge"],
        },
        {
            testName: "Saved example — meters that are communicating with hierarchy row",
            scenario: "contract_communicated_with_rows",
            isContractFixture: true,
            tags: ["@dashboard", "@dtr-communication-details", "@edge"],
        },
    ];
