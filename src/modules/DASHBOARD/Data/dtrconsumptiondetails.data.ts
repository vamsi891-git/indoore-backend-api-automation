import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrConsumptionDetailsQuery } from "../Api/dtrconsumptiondetails.api";
import type {
    DtrConsumptionDetailsKind,
    DtrConsumptionDetailsResponse,
    DtrConsumptionDetailsScenario,
} from "../Mapper/dtrconsumptiondetails.mapper";

export const dtrConsumptionDetailsMaxResponseTimeMs =
    MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrConsumptionDetailsSuccessMessage =
    "DTR consumption details fetched successfully.";

export {
    dtrUnbalanceUnauthorizedMessage as dtrConsumptionDetailsUnauthorizedMessage,
    dtrUnbalanceAccessTokenInvalidMessage as dtrConsumptionDetailsAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Shared hierarchy + identity columns (metric column swaps with `kind`). */
export const DTR_CONSUMPTION_DETAILS_BASE_COLUMN_KEYS = [
    "circle",
    "division",
    "zone",
    "subStation",
    "feeder",
    "dtr",
    "msn",
] as const;

export const DTR_CONSUMPTION_DETAILS_KIND_HEADERS: Record<
    DtrConsumptionDetailsKind,
    string
> = {
    kwh: "kWh",
    kvah: "kVAh",
    kvarh: "kVARh",
};

export function columnKeysForKind(
    kind: DtrConsumptionDetailsKind,
): string[] {
    return [
        ...DTR_CONSUMPTION_DETAILS_BASE_COLUMN_KEYS,
        kind,
        "logDate",
    ];
}

function columnsForKind(kind: DtrConsumptionDetailsKind) {
    return [
        { key: "circle", header: "Circle" },
        { key: "division", header: "Division" },
        { key: "zone", header: "Zone" },
        { key: "subStation", header: "Sub Station" },
        { key: "feeder", header: "Feeder" },
        { key: "dtr", header: "DTR" },
        { key: "msn", header: "MSN" },
        { key: kind, header: DTR_CONSUMPTION_DETAILS_KIND_HEADERS[kind] },
        { key: "logDate", header: "Log Date" },
    ];
}

const emptyPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

function emptyContract(
    kind: DtrConsumptionDetailsKind,
): DtrConsumptionDetailsResponse {
    return {
        success: true,
        data: {
            columns: columnsForKind(kind),
            rows: [],
            pagination: { ...emptyPagination },
        },
        message: dtrConsumptionDetailsSuccessMessage,
    };
}

function withRowsContract(
    kind: DtrConsumptionDetailsKind,
): DtrConsumptionDetailsResponse {
    return {
        success: true,
        data: {
            columns: columnsForKind(kind),
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
                    [kind]: 0,
                    logDate: null,
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1134,
                totalPages: 114,
            },
        },
        message: dtrConsumptionDetailsSuccessMessage,
    };
}

export const dtrConsumptionDetailsContractKwhEmpty = emptyContract("kwh");
export const dtrConsumptionDetailsContractKvahEmpty = emptyContract("kvah");
export const dtrConsumptionDetailsContractKvarhEmpty = emptyContract("kvarh");
export const dtrConsumptionDetailsContractKwhWithRows = withRowsContract("kwh");
export const dtrConsumptionDetailsContractKvahWithRows =
    withRowsContract("kvah");
export const dtrConsumptionDetailsContractKvarhWithRows =
    withRowsContract("kvarh");

export interface DtrConsumptionDetailsTestCase {
    testName: string;
    scenario: DtrConsumptionDetailsScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function kindForScenario(
    scenario: DtrConsumptionDetailsScenario,
): DtrConsumptionDetailsKind {
    switch (scenario) {
        case "dev_live_kvah":
        case "contract_kvah_empty":
        case "contract_kvah_with_rows":
            return "kvah";
        case "dev_live_kvarh":
        case "contract_kvarh_empty":
        case "contract_kvarh_with_rows":
            return "kvarh";
        default:
            return "kwh";
    }
}

export function resolveDtrConsumptionDetailsQuery(
    scenario: DtrConsumptionDetailsScenario,
): DtrConsumptionDetailsQuery {
    const kind = kindForScenario(scenario);
    switch (scenario) {
        case "dev_live_page_limit":
            return { kind, page: 1, limit: 5 };
        case "dev_ignore_unknown_query":
            return { kind, page: 1, limit: 10, foo: "bar" };
        default:
            return { kind, page: 1, limit: 10 };
    }
}

export function resolveDtrConsumptionDetailsContractBody(
    scenario: DtrConsumptionDetailsScenario,
): DtrConsumptionDetailsResponse | null {
    switch (scenario) {
        case "contract_kwh_empty":
            return dtrConsumptionDetailsContractKwhEmpty;
        case "contract_kvah_empty":
            return dtrConsumptionDetailsContractKvahEmpty;
        case "contract_kvarh_empty":
            return dtrConsumptionDetailsContractKvarhEmpty;
        case "contract_kwh_with_rows":
            return dtrConsumptionDetailsContractKwhWithRows;
        case "contract_kvah_with_rows":
            return dtrConsumptionDetailsContractKvahWithRows;
        case "contract_kvarh_with_rows":
            return dtrConsumptionDetailsContractKvarhWithRows;
        default:
            return null;
    }
}

export const dtrConsumptionDetailsTestCases: DtrConsumptionDetailsTestCase[] = [
    {
        testName: "DTR consumption list — active energy (kWh)",
        scenario: "dev_live_kwh",
        tags: ["@smoke", "@dashboard", "@dtr-consumption-details"],
    },
    {
        testName: "DTR consumption list — apparent energy (kVAh)",
        scenario: "dev_live_kvah",
        tags: ["@dashboard", "@dtr-consumption-details"],
    },
    {
        testName: "DTR consumption list — reactive energy (kVArh)",
        scenario: "dev_live_kvarh",
        tags: ["@dashboard", "@dtr-consumption-details"],
    },
    {
        testName: "DTR consumption list — page 2 still shows a valid list",
        scenario: "dev_live_page_limit",
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
    {
        testName: "DTR consumption list — extra unused filters are ignored",
        scenario: "dev_ignore_unknown_query",
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
    {
        testName: "Saved example — active energy (kWh) empty page",
        scenario: "contract_kwh_empty",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
    {
        testName: "Saved example — apparent energy (kVAh) empty page",
        scenario: "contract_kvah_empty",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
    {
        testName: "Saved example — reactive energy (kVArh) empty page",
        scenario: "contract_kvarh_empty",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
    {
        testName: "Saved example — active energy (kWh) with rows (total 1134)",
        scenario: "contract_kwh_with_rows",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
    {
        testName: "Saved example — apparent energy (kVAh) with rows (total 1134)",
        scenario: "contract_kvah_with_rows",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
    {
        testName: "Saved example — reactive energy (kVArh) with rows (total 1134)",
        scenario: "contract_kvarh_with_rows",
        isContractFixture: true,
        tags: ["@dashboard", "@dtr-consumption-details", "@edge"],
    },
];
