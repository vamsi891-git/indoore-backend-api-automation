export const dtrLoadDefaultFromDate =
  process.env.DTR_LOAD_FROM_DATE?.trim() || "2025-10-01";
export const dtrLoadDefaultToDate =
  process.env.DTR_LOAD_TO_DATE?.trim() || "2025-10-30";
export const dtrLoadDefaultPage = 1;
export const dtrLoadDefaultLimit = 10;
export const dtrLoadBeyondPage = 99999;

export const dtrLoadTypes = [
  "hourly_actual_load",
  "hourly_load_percentage",
  "consumption",
  "loading",
  "unbalance_loading",
  "load_summary",
] as const;

export type DtrLoadType = (typeof dtrLoadTypes)[number];

export type DtrLoadScenario =
  | "live_hourly_actual"
  | "live_hourly_percentage"
  | "live_consumption"
  | "live_loading"
  | "live_unbalance"
  | "live_summary"
  | "live_limit_one"
  | "live_page_two"
  | "live_beyond"
  | "live_unknown_query"
  | "contract_hourly"
  | "contract_zero_hours"
  | "contract_consumption"
  | "invalid_type"
  | "from_after_to"
  | "missing_from"
  | "missing_to"
  | "invalid_page"
  | "invalid_limit";

export interface DtrLoadQuery {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  type?: string;
  foo?: string;
  unused?: number;
}

export interface DtrLoadColumn {
  key: string;
  header: string;
}

const hourColumns: DtrLoadColumn[] = Array.from({ length: 24 }, (_, i) => ({
  key: `H${i + 1}`,
  header: `H${i + 1}`,
}));

const hierarchyHourly: DtrLoadColumn[] = [
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "subStation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtrName", header: "DTR Name" },
  { key: "dtrType", header: "DTR Type" },
  { key: "dtrRating", header: "DTR Rating" },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "mf", header: "MF" },
  ...hourColumns,
  { key: "meterLookupId", header: "Meter Lookup ID" },
];

export const dtrLoadColumnsByType: Record<DtrLoadType, DtrLoadColumn[]> = {
  hourly_actual_load: [
    ...hierarchyHourly,
    { key: "totalHourlyKva", header: "Total Hourly kVA" },
    { key: "avgKva", header: "Avg kVA" },
  ],
  hourly_load_percentage: hierarchyHourly,
  consumption: [
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "feeder", header: "Feeder" },
    { key: "dtrName", header: "DTR Name" },
    { key: "dtrRating", header: "DTR Rating" },
    { key: "logDate", header: "Log Date" },
    { key: "meterSerialNumber", header: "Meter Serial Number" },
    ...hourColumns,
    { key: "totalKwh", header: "Total kWh" },
    { key: "hourlyValuesUnit", header: "Hourly Values Unit" },
    { key: "meterLookupId", header: "Meter Lookup ID" },
  ],
  loading: [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Substation" },
    { key: "feeder", header: "Feeder" },
    { key: "dtrName", header: "DTR Name" },
    { key: "msn", header: "MSN" },
    { key: "mf", header: "MF" },
    { key: "dtrRatingKva", header: "DTR Rating (kVA)" },
    { key: "loadingKva", header: "DTR Loading (kVA)" },
    { key: "loadPercent", header: "Load %" },
    { key: "meterLookupId", header: "Meter Lookup ID" },
  ],
  unbalance_loading: [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Substation" },
    { key: "feeder", header: "Feeder" },
    { key: "dtrName", header: "DTR Name" },
    { key: "msn", header: "MSN" },
    { key: "mf", header: "MF" },
    { key: "dtrRating", header: "DTR Rating" },
    { key: "loadVariation", header: "Load Variation" },
    { key: "IR", header: "IR" },
    { key: "IY", header: "IY" },
    { key: "IB", header: "IB" },
    { key: "meterLookupId", header: "Meter Lookup ID" },
  ],
  load_summary: [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "subStation", header: "Substation" },
    { key: "feeder", header: "Feeder" },
    { key: "dtrName", header: "DTR Name" },
    { key: "msn", header: "MSN" },
    { key: "mf", header: "MF" },
    { key: "dtrRating", header: "DTR Rating" },
    { key: "kWh", header: "kWh" },
    { key: "avgLoadKva", header: "Avg Load (kVA)" },
    { key: "maxLoadKva", header: "Max Load (kVA)" },
    { key: "maxLoadPercent", header: "Max Load %" },
    { key: "minLoadKva", header: "Min Load (kVA)" },
    { key: "meterLookupId", header: "Meter Lookup ID" },
  ],
};

function primaryQuery(overrides: Partial<DtrLoadQuery> = {}): DtrLoadQuery {
  return {
    page: dtrLoadDefaultPage,
    limit: dtrLoadDefaultLimit,
    fromDate: dtrLoadDefaultFromDate,
    toDate: dtrLoadDefaultToDate,
    type: "hourly_actual_load",
    ...overrides,
  };
}

export function resolveDtrLoadQuery(scenario: DtrLoadScenario): DtrLoadQuery {
  switch (scenario) {
    case "live_hourly_percentage":
      return primaryQuery({ type: "hourly_load_percentage" });
    case "live_consumption":
      return primaryQuery({ type: "consumption" });
    case "live_loading":
      return primaryQuery({ type: "loading" });
    case "live_unbalance":
      return primaryQuery({ type: "unbalance_loading" });
    case "live_summary":
      return primaryQuery({ type: "load_summary" });
    case "live_limit_one":
      return primaryQuery({ limit: 1 });
    case "live_page_two":
      return primaryQuery({ page: 2 });
    case "live_beyond":
      return primaryQuery({ page: dtrLoadBeyondPage });
    case "live_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_type":
      return primaryQuery({ type: "not_a_real_type" });
    case "from_after_to":
      return primaryQuery({
        fromDate: dtrLoadDefaultToDate,
        toDate: dtrLoadDefaultFromDate,
      });
    case "missing_from":
      return primaryQuery({ fromDate: undefined });
    case "missing_to":
      return primaryQuery({ toDate: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    default:
      return primaryQuery();
  }
}

export function resolveDtrLoadType(query: DtrLoadQuery): DtrLoadType {
  const type = query.type;
  if (dtrLoadTypes.includes(type as DtrLoadType)) {
    return type as DtrLoadType;
  }
  return "hourly_actual_load";
}

export interface DtrLoadTestCase {
  testName: string;
  scenario: DtrLoadScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

export const dtrLoadTestCases: DtrLoadTestCase[] = [
  {
    testName:
      "Transformer load — October 2025 first page lists each transformer’s load by hour",
    scenario: "live_hourly_actual",
    tags: ["@smoke", "@dtr-load"],
  },
  {
    testName:
      "Transformer load — first page shows load as a percent of the transformer size",
    scenario: "live_hourly_percentage",
    tags: ["@dtr-load"],
  },
  {
    testName:
      "Transformer load — first page lists how much energy each transformer used by hour",
    scenario: "live_consumption",
    tags: ["@dtr-load"],
  },
  {
    testName:
      "Transformer load — first page lists how heavily each transformer is loaded",
    scenario: "live_loading",
    tags: ["@dtr-load"],
  },
  {
    testName:
      "Transformer load — first page lists how uneven the three phases are",
    scenario: "live_unbalance",
    tags: ["@dtr-load"],
  },
  {
    testName:
      "Transformer load — first page lists average, highest, and lowest load",
    scenario: "live_summary",
    tags: ["@dtr-load"],
  },
  {
    testName:
      "Transformer load — asking for one transformer at a time still returns a row",
    scenario: "live_limit_one",
    tags: ["@dtr-load", "@edge"],
  },
  {
    testName:
      "Transformer load — page 2 continues the list without repeating a transformer",
    scenario: "live_page_two",
    tags: ["@dtr-load", "@edge"],
  },
  {
    testName: "Transformer load — a page far past the end of the list is empty",
    scenario: "live_beyond",
    tags: ["@dtr-load", "@edge"],
  },
  {
    testName: "Transformer load — leftover unused filters are ignored",
    scenario: "live_unknown_query",
    tags: ["@dtr-load", "@edge"],
  },
  {
    testName:
      "Transformer load — October 2025 sample row matches the live layout",
    scenario: "contract_hourly",
    isContractFixture: true,
    tags: ["@dtr-load", "@edge"],
  },
  {
    testName:
      "Transformer load — a transformer with almost no load is still a valid row",
    scenario: "contract_zero_hours",
    isContractFixture: true,
    tags: ["@dtr-load", "@edge"],
  },
  {
    testName:
      "Transformer load — energy-use sample shows a start/end date and a unit",
    scenario: "contract_consumption",
    isContractFixture: true,
    tags: ["@dtr-load", "@edge"],
  },
  {
    testName: "Transformer load — an unknown report type is rejected",
    scenario: "invalid_type",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
  },
  {
    testName: "Transformer load — start date after end date is rejected",
    scenario: "from_after_to",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
  },
  {
    testName: "Transformer load — leaving out the start date is rejected",
    scenario: "missing_from",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
  },
  {
    testName: "Transformer load — leaving out the end date is rejected",
    scenario: "missing_to",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
  },
  {
    testName: "Transformer load — page numbering must start at 1",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
  },
  {
    testName: "Transformer load — asking for zero rows per page is rejected",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
  },
];

const hourlyH = {
  H1: 8.33, H2: 7.67, H3: 7.27, H4: 7.14, H5: 7.28, H6: 7.46,
  H7: 8.75, H8: 9.2, H9: 8.95, H10: 7.94, H11: 7.79, H12: 7.33,
  H13: 7.99, H14: 7.74, H15: 7.67, H16: 7.73, H17: 8.16, H18: 8.46,
  H19: 9.34, H20: 9.91, H21: 9.4, H22: 8.97, H23: 8.56, H24: 8.75,
};

const zeroH = {
  H1: 0, H2: 0.01, H3: 0.02, H4: 0.01, H5: 0.01, H6: 0.01,
  H7: 0.01, H8: 0.01, H9: 0.01, H10: 0, H11: 0, H12: 0,
  H13: 0, H14: 0, H15: 0, H16: 0, H17: 0, H18: 0,
  H19: 0, H20: 0, H21: 0, H22: 0, H23: 0, H24: 0,
};

export const dtrLoadHourlyFixture = {
  success: true as const,
  data: {
    columns: dtrLoadColumnsByType.hourly_actual_load,
    rows: [
      {
        id: "meter-19272306",
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "Citi Control Room",
        feeder: "SHIV VILLAS PALA.(CHQ)",
        dtrName: "11IW10",
        dtrType: "DTR",
        dtrRating: 500,
        meterSerialNumber: "19272306",
        mf: 120,
        ...hourlyH,
        meterLookupId: 121913,
        totalHourlyKva: 197.79,
        avgKva: 8.24,
        msn: "19272306",
      },
    ],
    pagination: { page: 1, limit: 10, total: 798, totalPages: 80 },
  },
};

export const dtrLoadZeroHoursFixture = {
  success: true as const,
  data: {
    columns: dtrLoadColumnsByType.hourly_actual_load,
    rows: [
      {
        id: "meter-19272333",
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "Citi Control Room",
        feeder: "SHIV VILLAS PALA.(CHQ)",
        dtrName: "11IW8",
        dtrType: "DTR",
        dtrRating: 200,
        meterSerialNumber: "19272333",
        mf: 80,
        ...zeroH,
        meterLookupId: 121919,
        totalHourlyKva: 0.09,
        avgKva: 0.01,
        msn: "19272333",
      },
    ],
    pagination: { page: 1, limit: 10, total: 798, totalPages: 80 },
  },
};

export const dtrLoadConsumptionFixture = {
  success: true as const,
  data: {
    columns: dtrLoadColumnsByType.consumption,
    rows: [
      {
        id: "meter-19272306",
        division: "WEST",
        zone: "GPH",
        feeder: "SHIV VILLAS PALA.(CHQ)",
        dtrName: "11IW10",
        dtrRating: 500,
        logDate: `${dtrLoadDefaultFromDate}/${dtrLoadDefaultToDate}`,
        meterSerialNumber: "19272306",
        H1: 996.5,
        H2: 918.5,
        H3: 870.4,
        H4: 854.3,
        H5: 871.6,
        H6: 891,
        H7: 1042.1,
        H8: 1086.6,
        H9: 1053.3,
        H10: 938.6,
        H11: 922.3,
        H12: 867,
        H13: 942.2,
        H14: 917,
        H15: 910.4,
        H16: 921.3,
        H17: 974.7,
        H18: 1010.1,
        H19: 1118.4,
        H20: 1187.5,
        H21: 1126.4,
        H22: 1073.4,
        H23: 1026.7,
        H24: 1050.2,
        totalKwh: 23570.5,
        hourlyValuesUnit: "kWh",
        meterLookupId: 121913,
      },
    ],
    pagination: { page: 1, limit: 10, total: 798, totalPages: 80 },
  },
};

export function resolveDtrLoadFixture(scenario: DtrLoadScenario) {
  if (scenario === "contract_zero_hours") {
    return dtrLoadZeroHoursFixture;
  }
  if (scenario === "contract_consumption") {
    return dtrLoadConsumptionFixture;
  }
  return dtrLoadHourlyFixture;
}
