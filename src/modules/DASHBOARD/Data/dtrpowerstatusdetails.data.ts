import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrPowerStatusDetailsQuery } from "../Api/dtrpowerstatusdetails.api";
import type {
    DtrPowerStatusDetailsResponse,
    DtrPowerStatusDetailsScenario,
    DtrPowerStatusDetailsStatus,
} from "../Mapper/dtrpowerstatusdetails.mapper";

export const dtrPowerStatusDetailsMaxResponseTimeMs =
    MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrPowerStatusDetailsSuccessMessage =
    "DTR power status details fetched successfully.";

export {
    dtrUnbalanceUnauthorizedMessage as dtrPowerStatusDetailsUnauthorizedMessage,
    dtrUnbalanceAccessTokenInvalidMessage as dtrPowerStatusDetailsAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Fixed column set for on/off (live samples Aug 2026). */
export const DTR_POWER_STATUS_DETAILS_COLUMN_KEYS = [
    "circle",
    "division",
    "zone",
    "subStation",
    "feeder",
    "dtr",
    "msn",
    "status",
    "lastAlarmAt",
] as const;

const powerStatusDetailsColumns = [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Sub Station" },
    { key: "feeder", header: "Feeder" },
    { key: "dtr", header: "DTR" },
    { key: "msn", header: "MSN" },
    { key: "status", header: "Status" },
    { key: "lastAlarmAt", header: "Last Alarm At" },
];

const emptyPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

/** Live sample — status=off empty fleet page. */
export const dtrPowerStatusDetailsContractOffEmpty: DtrPowerStatusDetailsResponse =
    {
        success: true,
        data: {
            columns: powerStatusDetailsColumns,
            rows: [],
            pagination: { ...emptyPagination },
        },
        message: dtrPowerStatusDetailsSuccessMessage,
    };

/** Contract — status=on empty page. */
export const dtrPowerStatusDetailsContractOnEmpty: DtrPowerStatusDetailsResponse =
    {
        success: true,
        data: {
            columns: powerStatusDetailsColumns,
            rows: [],
            pagination: { ...emptyPagination },
        },
        message: dtrPowerStatusDetailsSuccessMessage,
    };

/**
 * Live sample shape — status=on page with hierarchy + MSN rows.
 * Fixture keeps reported pagination totals; row list is a single sample row.
 */
export const dtrPowerStatusDetailsContractOnWithRows: DtrPowerStatusDetailsResponse =
    {
        success: true,
        data: {
            columns: powerStatusDetailsColumns,
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
                    status: "ON",
                    lastAlarmAt: null,
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1134,
                totalPages: 114,
            },
        },
        message: dtrPowerStatusDetailsSuccessMessage,
    };

/** Contract — status=off page with one OFF row (alarm timestamp present). */
export const dtrPowerStatusDetailsContractOffWithRows: DtrPowerStatusDetailsResponse =
    {
        success: true,
        data: {
            columns: powerStatusDetailsColumns,
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
                    status: "OFF",
                    lastAlarmAt: "13th Jul 2026, 02:00 AM",
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        },
        message: dtrPowerStatusDetailsSuccessMessage,
    };

export interface DtrPowerStatusDetailsTestCase {
    testName: string;
    scenario: DtrPowerStatusDetailsScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function statusForScenario(
    scenario: DtrPowerStatusDetailsScenario,
): DtrPowerStatusDetailsStatus {
    switch (scenario) {
        case "dev_live_off":
        case "contract_off_empty":
        case "contract_off_with_rows":
            return "off";
        default:
            return "on";
    }
}

export function resolveDtrPowerStatusDetailsQuery(
    scenario: DtrPowerStatusDetailsScenario,
): DtrPowerStatusDetailsQuery {
    const status = statusForScenario(scenario);
    switch (scenario) {
        case "dev_live_page_limit":
            return { status, page: 1, limit: 5 };
        case "dev_ignore_unknown_query":
            return { status, page: 1, limit: 10, foo: "bar" };
        default:
            return { status, page: 1, limit: 10 };
    }
}

export function resolveDtrPowerStatusDetailsContractBody(
    scenario: DtrPowerStatusDetailsScenario,
): DtrPowerStatusDetailsResponse | null {
    switch (scenario) {
        case "contract_on_empty":
            return dtrPowerStatusDetailsContractOnEmpty;
        case "contract_off_empty":
            return dtrPowerStatusDetailsContractOffEmpty;
        case "contract_on_with_rows":
            return dtrPowerStatusDetailsContractOnWithRows;
        case "contract_off_with_rows":
            return dtrPowerStatusDetailsContractOffWithRows;
        default:
            return null;
    }
}

export const dtrPowerStatusDetailsTestCases: DtrPowerStatusDetailsTestCase[] = [
    {
        testName: "DTR power on/off list — DTRs that are ON",
        scenario: "dev_live_on",
        tags: ["@smoke", "@dashboard", "@dtr-power-status-details"],
    },
    {
        testName: "DTR power on/off list — DTRs that are OFF",
        scenario: "dev_live_off",
        tags: ["@dashboard", "@dtr-power-status-details"],
    },
    {
        testName: "DTR power on/off list — page 2 still shows a valid list",
        scenario: "dev_live_page_limit",
        tags: ["@dashboard", "@dtr-power-status-details", "@edge"],
    },
    {
        testName: "DTR power on/off list — extra unused filters are ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-power-status-details", "@edge"],
    },
    {
        testName: "Saved example — DTRs that are ON empty page",
        scenario: "contract_on_empty",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status-details", "@edge"],
    },
    {
        testName: "Saved example — DTRs that are OFF empty page",
        scenario: "contract_off_empty",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status-details", "@edge"],
    },
    {
        testName: "Saved example — DTRs that are ON with rows (total 1134)",
        scenario: "contract_on_with_rows",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status-details", "@edge"],
    },
    {
        testName: "Saved example — DTRs that are OFF with hierarchy row",
        scenario: "contract_off_with_rows",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-power-status-details", "@edge"],
    },
];
