import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { MinMaxVoltageQuery as MinMaxVoltageApiQuery } from "../Api/minmaxvoltage.api";
import type {
  MinMaxVoltageColumn,
  MinMaxVoltageResponse,
  MinMaxVoltageScenario,
} from "../Mapper/minmaxvoltage.mapper";
import { minMaxVoltageColumnKeys } from "../Mapper/minmaxvoltage.mapper";

export type MinMaxVoltageQuery = MinMaxVoltageApiQuery & {
  foo?: string;
  unused?: number;
};

export const minMaxVoltageMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary — Oct 2025 min R, meterPhaseTblRefId=3. */
export const minMaxVoltageDefaultMeterPhaseTblRefId = 3;
export const minMaxVoltageDefaultMonth = 10;
export const minMaxVoltageDefaultYear = 2025;
export const minMaxVoltageDefaultVoltageType = "min" as const;
export const minMaxVoltageDefaultPhase = "R" as const;
export const minMaxVoltageDefaultPage = 1;
export const minMaxVoltageDefaultLimit = 10;
export const minMaxVoltageBeyondPage = 99;

export const minMaxVoltageExpectedColumns: MinMaxVoltageColumn[] = [
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
  { key: "voltage", header: "Voltage" },
  { key: "meterReadingDateTime", header: "Meter Reading Date Time" },
];

function primaryQuery(
  overrides: Partial<MinMaxVoltageQuery> = {},
): MinMaxVoltageQuery {
  return {
    meterPhaseTblRefId: minMaxVoltageDefaultMeterPhaseTblRefId,
    month: minMaxVoltageDefaultMonth,
    year: minMaxVoltageDefaultYear,
    voltageType: minMaxVoltageDefaultVoltageType,
    phase: minMaxVoltageDefaultPhase,
    page: minMaxVoltageDefaultPage,
    limit: minMaxVoltageDefaultLimit,
    includeTotal: true,
    ...overrides,
  };
}

export const minMaxVoltageContractLiveFullResponse: MinMaxVoltageResponse = {
  success: true,
  data: {
    columns: [...minMaxVoltageExpectedColumns],
    rows: [
      {
        id: "row-1-22253936",
        slNo: 1,
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "RajMohalla",
        subStation: "JINCY",
        feeder: "GOVT. PREES(CHQ)",
        dtr: "25CW10",
        sanctionedLoadKw: "80",
        name: "ASSISTANT ENGINEER LOK SWASTH YANTHIKI VIBHAG MEKENICAL UPKHAND INDORE",
        address: "..REGIONAL PRESS MALHAR GANJ ...",
        ivrsNumber: "N3004023055",
        category: "LV2.2",
        meterSerialNumber: "22253936",
        phase: "3PH 4CT",
        voltage: "217.300",
        meterReadingDateTime: "14-10-2025 11:45",
      },
      {
        id: "row-2-19272218",
        slNo: 2,
        circle: "Indore city circle",
        division: "NORTH",
        zone: "Aranya",
        subStation: "Scheme no 114",
        feeder: "RAJIV VIHAR 2(CHQ)",
        dtr: "AYN0000521",
        sanctionedLoadKw: "110",
        name: "ROHIT PORWAL S/O LEKHRAJ PORWAL",
        address: "PLOT NO.90 SCHEME NO.78 PART-2, INDORE, INDORE",
        ivrsNumber: "3969022566",
        category: "LV 2.2",
        meterSerialNumber: "19272218",
        phase: "3PH 4CT",
        voltage: "217.750",
        meterReadingDateTime: "14-10-2025 16:30",
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 10,
      totalPages: 1,
      totalIsExact: true,
      hasMore: false,
      nextCursor: null,
    },
  },
};

export const minMaxVoltageContractEmptyPageResponse: MinMaxVoltageResponse = {
  success: true,
  data: {
    columns: [...minMaxVoltageExpectedColumns],
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

export interface MinMaxVoltageTestCase {
  testName: string;
  scenario: MinMaxVoltageScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

/** Live voltageType × phase matrix (Oct 2025, meterPhaseTblRefId=3). */
export const minMaxVoltageLiveMatrix: Array<{
  scenario: Extract<
    MinMaxVoltageScenario,
    | "dev_live_primary"
    | "dev_live_min_y"
    | "dev_live_min_b"
    | "dev_live_max_r"
    | "dev_live_max_y"
    | "dev_live_max_b"
  >;
  voltageType: "min" | "max";
  phase: "R" | "Y" | "B";
  label: string;
}> = [
  {
    scenario: "dev_live_primary",
    voltageType: "min",
    phase: "R",
    label: "min R",
  },
  {
    scenario: "dev_live_min_y",
    voltageType: "min",
    phase: "Y",
    label: "min Y",
  },
  {
    scenario: "dev_live_min_b",
    voltageType: "min",
    phase: "B",
    label: "min B",
  },
  {
    scenario: "dev_live_max_r",
    voltageType: "max",
    phase: "R",
    label: "max R",
  },
  {
    scenario: "dev_live_max_y",
    voltageType: "max",
    phase: "Y",
    label: "max Y",
  },
  {
    scenario: "dev_live_max_b",
    voltageType: "max",
    phase: "B",
    label: "max B",
  },
];

export function resolveMinMaxVoltageQuery(
  scenario: MinMaxVoltageScenario,
): MinMaxVoltageQuery {
  const matrix = minMaxVoltageLiveMatrix.find((m) => m.scenario === scenario);
  if (matrix) {
    return primaryQuery({
      voltageType: matrix.voltageType,
      phase: matrix.phase,
    });
  }

  switch (scenario) {
    case "dev_live_page_beyond":
      return primaryQuery({ page: minMaxVoltageBeyondPage });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_voltage_type":
      return primaryQuery({ voltageType: "peak" });
    case "invalid_phase":
      return primaryQuery({ phase: "X" });
    case "invalid_month":
      return primaryQuery({ month: 13 });
    case "missing_year":
      return primaryQuery({ year: undefined });
    case "missing_month":
      return primaryQuery({ month: undefined });
    case "missing_meter_phase":
      return primaryQuery({ meterPhaseTblRefId: undefined });
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

export function resolveMinMaxVoltageContractBody(
  scenario: MinMaxVoltageScenario,
): MinMaxVoltageResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return minMaxVoltageContractLiveFullResponse;
    case "contract_empty_page":
      return minMaxVoltageContractEmptyPageResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use named exports from this module. */
export const MinMaxVoltageData = {
  meterPhaseTblRefId: minMaxVoltageDefaultMeterPhaseTblRefId,
  month: minMaxVoltageDefaultMonth,
  year: minMaxVoltageDefaultYear,
  voltageType: minMaxVoltageDefaultVoltageType,
  phase: minMaxVoltageDefaultPhase,
  page: minMaxVoltageDefaultPage,
  limit: minMaxVoltageDefaultLimit,
  maxResponseTime: minMaxVoltageMaxResponseTimeMs,
  columnKeys: minMaxVoltageColumnKeys,
};

export const minMaxVoltageTestCases: MinMaxVoltageTestCase[] = [
  ...minMaxVoltageLiveMatrix.map((m) => ({
    testName: `Min-max voltage — Oct 2025 ${m.label} first page shows columns and meters`,
    scenario: m.scenario,
    tags:
      m.scenario === "dev_live_primary"
        ? (["@smoke", "@reports", "@min-max-voltage"] as string[])
        : (["@reports", "@min-max-voltage", "@matrix"] as string[]),
  })),
  {
    testName:
      "Min-max voltage — showing 1 per page returns at most 1 record",
    scenario: "dev_limit_one",
    tags: ["@reports", "@min-max-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — a page past the last page shows no records",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@min-max-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@min-max-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — Oct 2025 min R fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@min-max-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@min-max-voltage", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — invalid voltageType is rejected",
    scenario: "invalid_voltage_type",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — invalid phase is rejected",
    scenario: "invalid_phase",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — invalid month is rejected",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — missing year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — missing meterPhaseTblRefId is rejected",
    scenario: "missing_meter_phase",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Min-max voltage — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage", "@negative"],
    nonEmptyExpected: false,
  },
];
