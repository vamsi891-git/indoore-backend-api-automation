function resolveBillingInt(
  envKey: string,
  fallback: number,
  min?: number,
  max?: number,
): number {
  const raw = process.env[envKey]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const value = Math.floor(parsed);
  if (min != null && value < min) {
    return fallback;
  }
  if (max != null && value > max) {
    return fallback;
  }
  return value;
}

export { resolveBillingInt };

export const billingDataDefaultMonth = resolveBillingInt(
  "BILLING_DATA_MONTH",
  10,
  1,
  12,
);
export const billingDataDefaultYear = resolveBillingInt(
  "BILLING_DATA_YEAR",
  2025,
  2000,
  2100,
);
export const billingDataDefaultPage = resolveBillingInt(
  "BILLING_DATA_PAGE",
  1,
  1,
);
export const billingDataDefaultLimit = resolveBillingInt(
  "BILLING_DATA_LIMIT",
  10,
  1,
  100,
);
export const billingDataBeyondPage = 99999;

/** Kept for DB / contract callers. */
export const BillingDataTestData = {
  month: billingDataDefaultMonth,
  year: billingDataDefaultYear,
  page: billingDataDefaultPage,
  limit: billingDataDefaultLimit,
};

export type BillingDataScenario =
  | "dev_live_include_total"
  | "dev_live_without_total"
  | "dev_limit_one"
  | "dev_page_two"
  | "dev_meter_filter"
  | "dev_unknown_meter"
  | "dev_live_page_beyond"
  | "dev_ignore_unknown_query"
  | "contract_live_oct_2025"
  | "contract_sparse_and_sentinel"
  | "invalid_month"
  | "invalid_month_zero"
  | "invalid_year"
  | "missing_month"
  | "missing_year"
  | "invalid_page"
  | "invalid_limit"
  | "invalid_limit_too_high";

export interface BillingDataColumn {
  key: string;
  header: string;
}

export interface BillingDataQuery {
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  meterNumber?: string;
  foo?: string;
  unused?: number;
}

/** Live first-page meter used only for filter tests; skip if that serial is gone. */
export const billingDataKnownMeter = "85087252";

/** Live Oct 2025 column grid (mf is on the row, not in columns). */
export const billingDataExpectedColumns: BillingDataColumn[] = [
  { key: "slNo", header: "Sl No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "substation", header: "Sub Station" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "sanctionedLoadKw", header: "Sanctioned Load kW" },
  { key: "consumerName", header: "Consumer Name" },
  { key: "consumerAddress", header: "Address" },
  { key: "ivrsNumber", header: "IVRS No." },
  { key: "tariff", header: "Category" },
  { key: "serviceDate", header: "Service Date" },
  { key: "meterNumber", header: "Meter SL No." },
  { key: "meterMake", header: "Meter Make" },
  { key: "meterLookupTblRefId", header: "Meter Lookup Tbl Ref ID" },
  { key: "phase", header: "Phase" },
  { key: "hesTimestamp", header: "HES Timestamp" },
  { key: "entryDateTime", header: "MDMS Timestamp" },
  { key: "meterTimestamp", header: "Meter Timestamp" },
  { key: "pf", header: "PF" },
  { key: "kwhC", header: "kWh C" },
  { key: "kwhT1", header: "kWh T1" },
  { key: "kwhT2", header: "kWh T2" },
  { key: "kwhT3", header: "kWh T3" },
  { key: "kwhT4", header: "kWh T4" },
  { key: "kvahC", header: "kVAh C" },
  { key: "kvahT1", header: "kVAh T1" },
  { key: "kvahT2", header: "kVAh T2" },
  { key: "kvahT3", header: "kVAh T3" },
  { key: "kvahT4", header: "kVAh T4" },
  { key: "mdKw", header: "MD kW" },
  { key: "mdKwOt", header: "MD kW OT" },
  { key: "mdKva", header: "MD kVA" },
  { key: "mdKvaOt", header: "MD kVA OT" },
  { key: "billOnMin", header: "Bill On Min" },
  { key: "kwhExpC", header: "kWh Exp C" },
  { key: "kvahExpC", header: "kVAh Exp C" },
  { key: "rank", header: "Rank" },
];

function primaryQuery(overrides: Partial<BillingDataQuery> = {}): BillingDataQuery {
  return {
    month: billingDataDefaultMonth,
    year: billingDataDefaultYear,
    page: billingDataDefaultPage,
    limit: billingDataDefaultLimit,
    includeTotal: true,
    ...overrides,
  };
}

export interface BillingDataTestCase {
  testName: string;
  scenario: BillingDataScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

export function resolveBillingDataQuery(
  scenario: BillingDataScenario,
): BillingDataQuery {
  switch (scenario) {
    case "dev_live_without_total":
      return primaryQuery({ includeTotal: false });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_page_two":
      return primaryQuery({ page: 2 });
    case "dev_meter_filter":
      return primaryQuery({ meterNumber: billingDataKnownMeter });
    case "dev_unknown_meter":
      return primaryQuery({ meterNumber: "UNKNOWN999999" });
    case "dev_live_page_beyond":
      return primaryQuery({ page: billingDataBeyondPage });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_month":
      return primaryQuery({ month: 13 });
    case "invalid_month_zero":
      return primaryQuery({ month: 0 });
    case "invalid_year":
      return primaryQuery({ year: 0 });
    case "missing_month":
      return primaryQuery({ month: undefined });
    case "missing_year":
      return primaryQuery({ year: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    case "invalid_limit_too_high":
      return primaryQuery({ limit: 5001 });
    case "dev_live_include_total":
    case "contract_live_oct_2025":
    case "contract_sparse_and_sentinel":
    default:
      return primaryQuery();
  }
}

export const billingDataTestCases: BillingDataTestCase[] = [
  {
    testName: "Monthly billing — October 2025 first page lists meters and column headings",
    scenario: "dev_live_include_total",
    tags: ["@smoke", "@billing", "@billing-data"],
  },
  {
    testName: "Monthly billing — first page still lists meters when the grand total is turned off",
    scenario: "dev_live_without_total",
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — asking for one meter at a time still returns a row",
    scenario: "dev_limit_one",
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — page 2 continues the list without repeating a meter",
    scenario: "dev_page_two",
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — searching by a meter number returns only that meter",
    scenario: "dev_meter_filter",
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — a meter number that does not exist shows an empty list",
    scenario: "dev_unknown_meter",
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — a page far past the end of the list is empty",
    scenario: "dev_live_page_beyond",
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — leftover unused filters are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — October 2025 sample row matches the live layout",
    scenario: "contract_live_oct_2025",
    isContractFixture: true,
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName:
      "Monthly billing — a meter with no consumer name, zero PF, or a placeholder MD date is still valid",
    scenario: "contract_sparse_and_sentinel",
    isContractFixture: true,
    tags: ["@billing", "@billing-data", "@edge"],
  },
  {
    testName: "Monthly billing — month 13 is rejected (month must be January to December)",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
  {
    testName: "Monthly billing — month 0 is rejected",
    scenario: "invalid_month_zero",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
  {
    testName: "Monthly billing — year 0 is rejected",
    scenario: "invalid_year",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
  {
    testName: "Monthly billing — leaving out the month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
  {
    testName: "Monthly billing — leaving out the year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
  {
    testName: "Monthly billing — page numbering must start at 1",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
  {
    testName: "Monthly billing — asking for zero rows per page is rejected",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
  {
    testName: "Monthly billing — asking for more than 5000 rows per page is rejected",
    scenario: "invalid_limit_too_high",
    expectedStatus: 400,
    tags: ["@billing", "@billing-data", "@negative"],
  },
];

const billingPeriod = "2025-10-01 00:00";

export const billingDataOct2025Fixture = {
  success: true as const,
  data: {
    columns: billingDataExpectedColumns,
    rows: [
      {
        slNo: 1,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        substation: "Citi Control Room",
        feeder: "RAJWADA(CHQ)",
        dtr: "WI581",
        sanctionedLoadKw: "1.000",
        consumerName: "SMT GANGABAI KAMEDILAL",
        consumerAddress: "156/3ARJUNSINGH NAG156/3 ARJUNSINGH NAGAR -.",
        ivrsNumber: "N3477027402",
        tariff: "LV1.2",
        meterNumber: billingDataKnownMeter,
        phase: "1 PH",
        mf: 1,
        meterTimestamp: billingPeriod,
        serviceDate: "05-11-2018 13:45",
        entryDateTime: "2025-11-17 23:15",
        pf: 0.99,
        kwhC: 7476.59,
        kwhT1: 2646.26,
        kwhT2: 2490.46,
        kwhT3: 588.28,
        kwhT4: 1751.59,
        kwhT5: null,
        kwhT6: null,
        kwhT7: null,
        kwhT8: null,
        kvahC: 7507.01,
        kvahT1: 2662.52,
        kvahT2: 2497.08,
        kvahT3: 590.96,
        kvahT4: 1756.45,
        kvahT5: null,
        kvahT6: null,
        kvahT7: null,
        kvahT8: null,
        mdKw: "1.8340",
        mdKwOt: "2025-09-01 08:25",
        mdKva: "1.8340",
        mdKvaOt: "2025-09-01 08:25",
        billOnMin: 6358,
        kwhExpC: 0,
        kvahExpC: 0,
        meterMake: "L&T",
        meterLookupTblRefId: 8178,
        hesTimestamp: null,
        rank: 1,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 106653,
      totalPages: 10666,
    },
    billingClass: "d1",
    mappingProfile: "all",
  },
};

/** Two meters, same rank / feeder / billing date; one sparse; one sentinel MD OT. */
export const billingDataSparseSentinelFixture = {
  success: true as const,
  data: {
    columns: billingDataExpectedColumns,
    rows: [
      {
        slNo: 3,
        circle: "Indore city circle",
        division: "NORTH",
        zone: "electronic complex",
        substation: "Electronic Complex",
        feeder: "BHGIRATH PURA(CHQ)",
        dtr: "EC601",
        sanctionedLoadKw: "1.000",
        consumerName: "MAHESH BADRINARAYAN TIWARI",
        consumerAddress: "39 BHAGIRATHPURA STATION ROAD",
        ivrsNumber: "N3964032540",
        tariff: "LV2.2",
        meterNumber: "85126363",
        phase: "1 PH",
        mf: 1,
        meterTimestamp: billingPeriod,
        serviceDate: "25-02-2019 13:27",
        entryDateTime: "2025-11-17 00:46",
        pf: 0,
        kwhC: 2.01,
        kwhT1: 0,
        kwhT2: 0,
        kwhT3: 0,
        kwhT4: 2.01,
        kwhT5: null,
        kwhT6: null,
        kwhT7: null,
        kwhT8: null,
        kvahC: 2.01,
        kvahT1: 0,
        kvahT2: 0,
        kvahT3: 0,
        kvahT4: 2.01,
        kvahT5: null,
        kvahT6: null,
        kvahT7: null,
        kvahT8: null,
        mdKw: "0.0000",
        mdKwOt: "1900-01-01 05:21",
        mdKva: "0.0000",
        mdKvaOt: "1900-01-01 05:21",
        billOnMin: 11,
        kwhExpC: 0,
        kvahExpC: 0,
        meterMake: "L&T",
        meterLookupTblRefId: 48867,
        hesTimestamp: null,
        rank: 1,
      },
      {
        slNo: 10,
        circle: null,
        division: null,
        zone: null,
        substation: null,
        feeder: null,
        dtr: null,
        sanctionedLoadKw: null,
        consumerName: null,
        consumerAddress: null,
        ivrsNumber: null,
        tariff: null,
        meterNumber: "00262261",
        phase: "1 PH",
        mf: null,
        meterTimestamp: billingPeriod,
        serviceDate: null,
        entryDateTime: "2025-11-08 01:23",
        pf: 1,
        kwhC: 143.21,
        kwhT1: 81.28,
        kwhT2: 15.29,
        kwhT3: 12.74,
        kwhT4: 33.9,
        kwhT5: null,
        kwhT6: null,
        kwhT7: null,
        kwhT8: null,
        kvahC: 143.52,
        kvahT1: 81.28,
        kvahT2: 15.31,
        kvahT3: 12.99,
        kvahT4: 33.94,
        kvahT5: null,
        kvahT6: null,
        kvahT7: null,
        kvahT8: null,
        mdKw: "1.1890",
        mdKwOt: "2025-09-01 19:15",
        mdKva: "1.1890",
        mdKvaOt: "2025-09-01 19:15",
        billOnMin: 29428,
        kwhExpC: 0,
        kvahExpC: 0,
        meterMake: "LINKWELL TELESYSTEMS",
        meterLookupTblRefId: 45243,
        hesTimestamp: null,
        rank: 1,
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 106653,
      totalPages: 10666,
    },
    billingClass: "d1",
    mappingProfile: "all",
  },
};
