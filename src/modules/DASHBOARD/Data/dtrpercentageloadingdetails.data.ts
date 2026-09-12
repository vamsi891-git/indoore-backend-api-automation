import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrPercentageLoadingDetailsQuery } from "../Api/dtrpercentageloadingdetails.api";
import type {
    DtrPercentageLoadingDetailsBand,
    DtrPercentageLoadingDetailsResponse,
    DtrPercentageLoadingDetailsScenario,
} from "../Mapper/dtrpercentageloadingdetails.mapper";

export const dtrPercentageLoadingDetailsMaxResponseTimeMs =
    MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrPercentageLoadingDetailsSuccessMessage =
    "DTR percentage loading details fetched successfully.";

export {
    dtrUnbalanceUnauthorizedMessage as dtrPercentageLoadingDetailsUnauthorizedMessage,
    dtrUnbalanceAccessTokenInvalidMessage as dtrPercentageLoadingDetailsAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Fixed column set for every band (live samples Aug 2026). */
export const DTR_PERCENTAGE_LOADING_DETAILS_COLUMN_KEYS = [
    "circle",
    "division",
    "zone",
    "subStation",
    "feeder",
    "dtr",
    "msn",
    "loadingCondition",
    "loadingKva",
    "dtrRating",
    "loadPercent",
    "logDate",
] as const;

/** Display / threshold labels expected on `loadingCondition` for each `band` query. */
export const DTR_PERCENTAGE_LOADING_DETAILS_BAND_LABELS: Record<
    DtrPercentageLoadingDetailsBand,
    string
> = {
    critical: ">=75%",
    "high-load": ">=25% and <=74%",
    normal: ">=10% and <25%",
    "under-utilized": "<10%",
};

/** Older human-readable labels still accepted by validators. */
export const DTR_PERCENTAGE_LOADING_DETAILS_BAND_ALIASES: Record<
    DtrPercentageLoadingDetailsBand,
    readonly string[]
> = {
    critical: ["Critical", ">=75%"],
    "high-load": ["High Load", ">=25% and <=74%"],
    normal: ["Normal", ">=10% and <25%"],
    "under-utilized": ["Under Utilized", "<10%"],
};

const columns = [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Sub Station" },
    { key: "feeder", header: "Feeder" },
    { key: "dtr", header: "DTR" },
    { key: "msn", header: "MSN" },
    { key: "loadingCondition", header: "Loading Condition" },
    { key: "loadingKva", header: "DTR Loading (kVA)" },
    { key: "dtrRating", header: "DTR Capacity (kVA)" },
    { key: "loadPercent", header: "Load %" },
    { key: "logDate", header: "Log Date" },
];

const emptyPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

function emptyContract(): DtrPercentageLoadingDetailsResponse {
    return {
        success: true,
        data: {
            columns: [...columns],
            rows: [],
            pagination: { ...emptyPagination },
        },
        message: dtrPercentageLoadingDetailsSuccessMessage,
    };
}

function withRowsContract(
    band: DtrPercentageLoadingDetailsBand,
): DtrPercentageLoadingDetailsResponse {
    return {
        success: true,
        data: {
            columns: [...columns],
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
                    loadingCondition:
                        DTR_PERCENTAGE_LOADING_DETAILS_BAND_LABELS[band],
                    loadingKva: 0,
                    dtrRating: 100,
                    loadPercent: 0,
                    logDate: null,
                },
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            },
        },
        message: dtrPercentageLoadingDetailsSuccessMessage,
    };
}

export const dtrPercentageLoadingDetailsContractCriticalEmpty = emptyContract();
export const dtrPercentageLoadingDetailsContractHighLoadEmpty = emptyContract();
export const dtrPercentageLoadingDetailsContractNormalEmpty = emptyContract();
export const dtrPercentageLoadingDetailsContractUnderUtilizedEmpty =
    emptyContract();
export const dtrPercentageLoadingDetailsContractCriticalWithRows =
    withRowsContract("critical");
export const dtrPercentageLoadingDetailsContractHighLoadWithRows =
    withRowsContract("high-load");
export const dtrPercentageLoadingDetailsContractNormalWithRows =
    withRowsContract("normal");
export const dtrPercentageLoadingDetailsContractUnderUtilizedWithRows =
    withRowsContract("under-utilized");

export interface DtrPercentageLoadingDetailsTestCase {
    testName: string;
    scenario: DtrPercentageLoadingDetailsScenario;
    expectedStatus?: number;
    isContractFixture?: boolean;
    tags: string[];
}

export function bandForScenario(
    scenario: DtrPercentageLoadingDetailsScenario,
): DtrPercentageLoadingDetailsBand {
    switch (scenario) {
        case "dev_live_high_load":
        case "contract_high_load_empty":
        case "contract_high_load_with_rows":
            return "high-load";
        case "dev_live_normal":
        case "contract_normal_empty":
        case "contract_normal_with_rows":
            return "normal";
        case "dev_live_under_utilized":
        case "contract_under_utilized_empty":
        case "contract_under_utilized_with_rows":
            return "under-utilized";
        default:
            return "critical";
    }
}

export function resolveDtrPercentageLoadingDetailsQuery(
    scenario: DtrPercentageLoadingDetailsScenario,
): DtrPercentageLoadingDetailsQuery {
    const band = bandForScenario(scenario);
    switch (scenario) {
        case "dev_live_page_limit":
            return { band, page: 1, limit: 5 };
        case "dev_ignore_unknown_query":
            return { band, page: 1, limit: 10, foo: "bar" };
        default:
            return { band, page: 1, limit: 10 };
    }
}

export function resolveDtrPercentageLoadingDetailsContractBody(
    scenario: DtrPercentageLoadingDetailsScenario,
): DtrPercentageLoadingDetailsResponse | null {
    switch (scenario) {
        case "contract_critical_empty":
            return dtrPercentageLoadingDetailsContractCriticalEmpty;
        case "contract_high_load_empty":
            return dtrPercentageLoadingDetailsContractHighLoadEmpty;
        case "contract_normal_empty":
            return dtrPercentageLoadingDetailsContractNormalEmpty;
        case "contract_under_utilized_empty":
            return dtrPercentageLoadingDetailsContractUnderUtilizedEmpty;
        case "contract_critical_with_rows":
            return dtrPercentageLoadingDetailsContractCriticalWithRows;
        case "contract_high_load_with_rows":
            return dtrPercentageLoadingDetailsContractHighLoadWithRows;
        case "contract_normal_with_rows":
            return dtrPercentageLoadingDetailsContractNormalWithRows;
        case "contract_under_utilized_with_rows":
            return dtrPercentageLoadingDetailsContractUnderUtilizedWithRows;
        default:
            return null;
    }
}

export const dtrPercentageLoadingDetailsTestCases: DtrPercentageLoadingDetailsTestCase[] =
    [
        {
            testName: "DTR loading list — critically loaded DTRs",
            scenario: "dev_live_critical",
            tags: ["@smoke", "@dashboard", "@dtr-percentage-loading-details"],
        },
        {
            testName: "DTR loading list — high-load DTRs",
            scenario: "dev_live_high_load",
            tags: ["@dashboard", "@dtr-percentage-loading-details"],
        },
        {
            testName: "DTR loading list — normally loaded DTRs",
            scenario: "dev_live_normal",
            tags: ["@dashboard", "@dtr-percentage-loading-details"],
        },
        {
            testName: "DTR loading list — under-utilized DTRs",
            scenario: "dev_live_under_utilized",
            tags: ["@dashboard", "@dtr-percentage-loading-details"],
        },
        {
            testName: "DTR loading list — page 2 still shows a valid list",
            scenario: "dev_live_page_limit",
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "DTR loading list — extra unused filters are ignored",
            scenario: "dev_ignore_unknown_query",
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — critically loaded DTRs empty page",
            scenario: "contract_critical_empty",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — high-load DTRs empty page",
            scenario: "contract_high_load_empty",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — normally loaded DTRs empty page",
            scenario: "contract_normal_empty",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — under-utilized DTRs empty page",
            scenario: "contract_under_utilized_empty",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — critically loaded DTRs with rows",
            scenario: "contract_critical_with_rows",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — high-load DTRs with rows",
            scenario: "contract_high_load_with_rows",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — normally loaded DTRs with rows",
            scenario: "contract_normal_with_rows",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
        {
            testName: "Saved example — under-utilized DTRs with rows",
            scenario: "contract_under_utilized_with_rows",
            isContractFixture: true,
            tags: [
                "@dashboard",
                "@dtr-percentage-loading-details",
                "@edge",
            ],
        },
    ];
