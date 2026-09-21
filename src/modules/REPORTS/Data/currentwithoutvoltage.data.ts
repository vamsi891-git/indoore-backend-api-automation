import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CurrentWithoutVoltageQuery as CurrentWithoutVoltageApiQuery } from "../Api/currentwithoutvoltage.api";
import type {
  CurrentWithoutVoltageColumn,
  CurrentWithoutVoltageResponse,
  CurrentWithoutVoltageScenario,
} from "../Mapper/currentwithoutvoltage.mapper";
import { currentWithoutVoltageColumnKeys } from "../Mapper/currentwithoutvoltage.mapper";

export type CurrentWithoutVoltageQuery = CurrentWithoutVoltageApiQuery & {
  foo?: string;
  unused?: number;
};

export const currentWithoutVoltageMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary — phase=R Oct 2025, includeTotal=false. */
export const currentWithoutVoltageDefaultPhase = "R" as const;
export const currentWithoutVoltageDefaultMonth = 10;
export const currentWithoutVoltageDefaultYear = 2025;
export const currentWithoutVoltageDefaultPage = 1;
export const currentWithoutVoltageDefaultLimit = 10;
export const currentWithoutVoltageDefaultIncludeTotal = false;
export const currentWithoutVoltageBeyondPage = 99;

/** Fixed keys; current/voltage headers vary by query phase. */
export const currentWithoutVoltageFixedColumns: CurrentWithoutVoltageColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "sanctionedLoadKw", header: "Sanctioned Load (kW)" },
  { key: "name", header: "Consumer Name" },
  { key: "address", header: "Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "category", header: "Category" },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "phase", header: "Phase" },
  { key: "nightKwh", header: "Night kWh" },
  { key: "dayKwh", header: "Day kWh" },
  { key: "meterReadingDateTime", header: "Meter Reading Date Time" },
];

export function currentWithoutVoltagePhaseHeaders(phase: "R" | "Y" | "B"): {
  current: CurrentWithoutVoltageColumn;
  voltage: CurrentWithoutVoltageColumn;
} {
  return {
    current: { key: "rCurrent", header: `${phase} Current` },
    voltage: { key: "rnVoltage", header: `${phase}N Voltage` },
  };
}

export function currentWithoutVoltageExpectedColumns(
  phase: "R" | "Y" | "B" = currentWithoutVoltageDefaultPhase,
): CurrentWithoutVoltageColumn[] {
  const phaseCols = currentWithoutVoltagePhaseHeaders(phase);
  return [
    ...currentWithoutVoltageFixedColumns.slice(0, 14),
    phaseCols.current,
    phaseCols.voltage,
    ...currentWithoutVoltageFixedColumns.slice(14),
  ];
}

function primaryQuery(
  overrides: Partial<CurrentWithoutVoltageQuery> = {},
): CurrentWithoutVoltageQuery {
  return {
    phase: currentWithoutVoltageDefaultPhase,
    month: currentWithoutVoltageDefaultMonth,
    year: currentWithoutVoltageDefaultYear,
    page: currentWithoutVoltageDefaultPage,
    limit: currentWithoutVoltageDefaultLimit,
    includeTotal: currentWithoutVoltageDefaultIncludeTotal,
    ...overrides,
  };
}

/** Live sample: phase=R&month=10&year=2025&includeTotal=false (first 2 rows). */
export const currentWithoutVoltageContractLiveFullResponse: CurrentWithoutVoltageResponse =
  {
    success: true,
    data: {
      columns: currentWithoutVoltageExpectedColumns("R"),
      rows: [
        {
          id: "row-1-262710",
          slNo: 1,
          circle: "Indore city circle",
          division: "WEST",
          zone: "GPH",
          subStation: "JINCY",
          feeder: "KILAGATE(CHQ)",
          dtr: "WI682",
          sanctionedLoadKw: "0.1",
          name: "SNEHLATA TIWARI",
          address: "6-6 SHANKAR GANJ -INDORE",
          ivrsNumber: "N3477010442",
          category: "LV1.2",
          meterSerialNumber: "262710",
          phase: "1 PH",
          rCurrent: "1.350",
          rnVoltage: "0.000",
          nightKwh: "0.000",
          dayKwh: "0.080",
          meterReadingDateTime: "31-10-2025 23:45",
        },
        {
          id: "row-2-85130832",
          slNo: 2,
          circle: "Indore city circle",
          division: "NORTH",
          zone: "electronic complex",
          subStation: "Electronic Complex",
          feeder: "BHGIRATH PURA(CHQ)",
          dtr: "EC601",
          sanctionedLoadKw: "1",
          name: "PREMPRAKASH SHIVNARAYAN SHRIVA",
          address:
            "OLD-181OLD-181 NEW-634 BHAGIRATHPURA MOHATA NAGAR4 BHAGIRATHPURA MOHATA NAGA",
          ivrsNumber: "N3964017022",
          category: "LV1.2",
          meterSerialNumber: "85130832",
          phase: "1 PH",
          rCurrent: "1.350",
          rnVoltage: "0.000",
          nightKwh: "0.000",
          dayKwh: "0.080",
          meterReadingDateTime: "31-10-2025 23:45",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: null,
        totalPages: null,
        totalIsExact: false,
        hasMore: true,
        nextCursor: "2025-10-31 23:30:00.000|91603",
      },
    },
  };

export const currentWithoutVoltageContractEmptyPageResponse: CurrentWithoutVoltageResponse =
  {
    success: true,
    data: {
      columns: currentWithoutVoltageExpectedColumns("R"),
      rows: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        totalIsExact: true,
        hasMore: false,
        nextCursor: null,
      },
    },
  };

export interface CurrentWithoutVoltageTestCase {
  testName: string;
  scenario: CurrentWithoutVoltageScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const currentWithoutVoltageLiveMatrix: Array<{
  scenario: Extract<
    CurrentWithoutVoltageScenario,
    "dev_live_primary" | "dev_live_phase_y" | "dev_live_phase_b"
  >;
  phase: "R" | "Y" | "B";
  label: string;
}> = [
  { scenario: "dev_live_primary", phase: "R", label: "R" },
  { scenario: "dev_live_phase_y", phase: "Y", label: "Y" },
  { scenario: "dev_live_phase_b", phase: "B", label: "B" },
];

export function resolveCurrentWithoutVoltageQuery(
  scenario: CurrentWithoutVoltageScenario,
): CurrentWithoutVoltageQuery {
  const matrix = currentWithoutVoltageLiveMatrix.find(
    (m) => m.scenario === scenario,
  );
  if (matrix) {
    return primaryQuery({ phase: matrix.phase });
  }

  switch (scenario) {
    case "dev_live_page_beyond":
      return primaryQuery({ page: currentWithoutVoltageBeyondPage });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_phase":
      return primaryQuery({ phase: "X" });
    case "invalid_month":
      return primaryQuery({ month: 13 });
    case "missing_year":
      return primaryQuery({ year: undefined });
    case "missing_month":
      return primaryQuery({ month: undefined });
    case "dev_missing_phase_defaults":
      return primaryQuery({ phase: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    case "contract_live_full":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveCurrentWithoutVoltageContractBody(
  scenario: CurrentWithoutVoltageScenario,
): CurrentWithoutVoltageResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return currentWithoutVoltageContractLiveFullResponse;
    case "contract_empty_page":
      return currentWithoutVoltageContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const CurrentWithoutVoltageData = {
  phase: currentWithoutVoltageDefaultPhase,
  month: currentWithoutVoltageDefaultMonth,
  year: currentWithoutVoltageDefaultYear,
  page: currentWithoutVoltageDefaultPage,
  limit: currentWithoutVoltageDefaultLimit,
  maxResponseTime: currentWithoutVoltageMaxResponseTimeMs,
  columnKeys: currentWithoutVoltageColumnKeys,
};

export const currentWithoutVoltageTestCases: CurrentWithoutVoltageTestCase[] = [
  ...currentWithoutVoltageLiveMatrix.map((m) => ({
    testName: `Current without voltage — Oct 2025 phase ${m.label} first page shows columns and readings`,
    scenario: m.scenario,
    tags:
      m.scenario === "dev_live_primary"
        ? (["@smoke", "@reports", "@current-without-voltage"] as string[])
        : (["@reports", "@current-without-voltage", "@matrix"] as string[]),
  })),
  {
    testName:
      "Current without voltage — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@current-without-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "Current without voltage — a far page still returns a valid table",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@current-without-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@current-without-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — Oct 2025 phase R fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@current-without-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@current-without-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — invalid phase is rejected",
    scenario: "invalid_phase",
    expectedStatus: 400,
    tags: ["@reports", "@current-without-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — invalid month is rejected",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@reports", "@current-without-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — missing year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@reports", "@current-without-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@reports", "@current-without-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "Current without voltage — missing phase falls back to R",
    scenario: "dev_missing_phase_defaults",
    tags: ["@reports", "@current-without-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@current-without-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Current without voltage — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@current-without-voltage", "@negative"],
    nonEmptyExpected: false,
  },
];
