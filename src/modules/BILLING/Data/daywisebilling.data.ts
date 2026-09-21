import { resolveBillingInt } from "./billingdata.data";

export const daywiseDefaultMonth = resolveBillingInt(
  "DAYWISE_BILLING_MONTH",
  resolveBillingInt("BILLING_DATA_MONTH", 10, 1, 12),
  1,
  12,
);
export const daywiseDefaultYear = resolveBillingInt(
  "DAYWISE_BILLING_YEAR",
  resolveBillingInt("BILLING_DATA_YEAR", 2025, 2000, 2100),
  2000,
  2100,
);
export const daywiseDefaultPage = resolveBillingInt("DAYWISE_BILLING_PAGE", 1, 1);
export const daywiseDefaultLimit = resolveBillingInt("DAYWISE_BILLING_LIMIT", 10, 1, 100);
export const daywiseBeyondPage = 99999;

/** Kept for DB / contract callers. Default matches live: includeTotal=false. */
export const DaywiseBillingTestData = {
  month: daywiseDefaultMonth,
  year: daywiseDefaultYear,
  includeTotal: process.env.DAYWISE_BILLING_INCLUDE_TOTAL?.trim().toLowerCase() === "true",
  page: daywiseDefaultPage,
  limit: daywiseDefaultLimit,
};

export type DaywiseBillingScenario =
  | "dev_live_without_total"
  | "dev_live_include_total"
  | "dev_limit_one"
  | "dev_page_two"
  | "dev_meter_filter"
  | "dev_unknown_meter"
  | "dev_live_page_beyond"
  | "dev_ignore_unknown_query"
  | "dev_thirty_day_month"
  | "contract_live_oct_2025"
  | "contract_same_feeder_plateau"
  | "invalid_month"
  | "invalid_month_zero"
  | "invalid_year"
  | "missing_month"
  | "missing_year"
  | "invalid_page"
  | "invalid_limit";

export interface DaywiseColumn {
  key: string;
  header: string;
}

export interface DaywiseBillingQueryParams {
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
  includeTotal?: boolean;
  meterNumber?: string;
  foo?: string;
  unused?: number;
}

export const daywiseKnownMeter = "85080223";

export const daywiseExpectedColumns: DaywiseColumn[] = [
  { key: "slNo", header: "SL NO" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "consumerName", header: "Consumer Name" },
  { key: "consumerAddress", header: "Consumer Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "tariff", header: "Tariff" },
  { key: "meterNumber", header: "Meter Number" },
  { key: "phase", header: "Phase" },
  { key: "mf", header: "MF" },
  { key: "sanctionedLoadKw", header: "Sanctioned Load (kW)" },
  ...Array.from({ length: 31 }, (_, index) => ({
    key: `d${index + 1}Kwh`,
    header: `D${index + 1}`,
  })),
];

function primaryQuery(
  overrides: Partial<DaywiseBillingQueryParams> = {},
): DaywiseBillingQueryParams {
  return {
    month: daywiseDefaultMonth,
    year: daywiseDefaultYear,
    page: daywiseDefaultPage,
    limit: daywiseDefaultLimit,
    includeTotal: false,
    ...overrides,
  };
}

export interface DaywiseBillingTestCase {
  testName: string;
  scenario: DaywiseBillingScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveDaywiseQuery(scenario: DaywiseBillingScenario): DaywiseBillingQueryParams {
  switch (scenario) {
    case "dev_live_include_total":
      return primaryQuery({ includeTotal: true });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_page_two":
      return primaryQuery({ page: 2 });
    case "dev_meter_filter":
      return primaryQuery({ meterNumber: daywiseKnownMeter });
    case "dev_unknown_meter":
      return primaryQuery({ meterNumber: "UNKNOWN999999" });
    case "dev_live_page_beyond":
      return primaryQuery({ page: daywiseBeyondPage });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "dev_thirty_day_month":
      return primaryQuery({ month: 11, includeTotal: false });
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
    case "dev_live_without_total":
    case "contract_live_oct_2025":
    case "contract_same_feeder_plateau":
    default:
      return primaryQuery();
  }
}

export const daywiseBillingTestCases: DaywiseBillingTestCase[] = [
  {
    testName: "Day-by-day billing — October 2025 first page lists each day's reading",
    scenario: "dev_live_without_total",
    tags: ["@smoke", "@billing", "@daywise-billing"],
    nonEmptyExpected: true,
  },
  {
    testName: "Day-by-day billing — turning the exact total on still shows the same columns",
    scenario: "dev_live_include_total",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — asking for one meter at a time still returns a row",
    scenario: "dev_limit_one",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — page 2 continues the list without repeating a meter",
    scenario: "dev_page_two",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — searching by a meter number returns only that meter",
    scenario: "dev_meter_filter",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — a meter number that does not exist shows an empty list",
    scenario: "dev_unknown_meter",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — a page far past the end of the list is empty",
    scenario: "dev_live_page_beyond",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — leftover unused filters are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — November (30 days) does not fill a 31st day column",
    scenario: "dev_thirty_day_month",
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — October 2025 sample row matches the live layout",
    scenario: "contract_live_oct_2025",
    isContractFixture: true,
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "Day-by-day billing — two meters on the same feeder can share a DTR, and a no-usage day is allowed",
    scenario: "contract_same_feeder_plateau",
    isContractFixture: true,
    tags: ["@billing", "@daywise-billing", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — month 13 is rejected (month must be January to December)",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@billing", "@daywise-billing", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — month 0 is rejected",
    scenario: "invalid_month_zero",
    expectedStatus: 400,
    tags: ["@billing", "@daywise-billing", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — year 0 is rejected",
    scenario: "invalid_year",
    expectedStatus: 400,
    tags: ["@billing", "@daywise-billing", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — leaving out the month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@billing", "@daywise-billing", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — leaving out the year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@billing", "@daywise-billing", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — page numbering must start at 1",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@billing", "@daywise-billing", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Day-by-day billing — asking for zero rows per page is rejected",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@billing", "@daywise-billing", "@negative"],
    nonEmptyExpected: false,
  },
];

function kwhDays(values: number[]): Record<string, number> {
  const row: Record<string, number> = {};
  values.forEach((value, index) => {
    row[`d${index + 1}Kwh`] = value;
  });
  return row;
}

const firstMeterDays = [
  682.47, 684.05, 686.16, 687.38, 688.78, 688.86, 689.93, 691.04, 692.25, 693.43, 694.64, 695.71,
  695.8, 697.15, 698.46, 699.6, 700.88, 702.09, 703.45, 703.54, 703.62, 703.71, 704.71, 705.93,
  707.19, 708.51, 708.59, 710.14, 711.45, 712.66, 713.47,
];

/** Live row 3: D25–D28 stay at 6496.7 (zero-consumption plateau). */
const plateauDays = [
  6280.09, 6290.19, 6300.43, 6309.79, 6319.59, 6328.68, 6336.64, 6342.8, 6351.32, 6359.24, 6367.4,
  6376.3, 6390.26, 6399.4, 6406.34, 6418.21, 6427.81, 6439.22, 6451.66, 6462.62, 6472.73, 6479.94,
  6489.07, 6494.89, 6496.7, 6496.7, 6496.7, 6496.7, 6498.61, 6508.95, 6515.59,
];

export const daywiseOct2025Fixture = {
  success: true as const,
  data: {
    columns: daywiseExpectedColumns,
    rows: [
      {
        id: "row-1-85080223",
        slNo: 1,
        meterLookupId: 1095,
        division: "SOUTH",
        zone: "OPH South",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ666",
        consumerName: "M/S LAJWAN STEEL",
        consumerAddress: "27-S-5 JAWAHAR NAGARINDOREINDORE",
        ivrsNumber: "3544019391",
        tariff: "LV1.2",
        meterNumber: daywiseKnownMeter,
        phase: "1 PH",
        mf: 1,
        sanctionedLoadKw: 1,
        ...kwhDays(firstMeterDays),
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 11,
      totalPages: 2,
      totalIsExact: false,
      hasMore: true,
    },
  },
};

export const daywiseSameFeederPlateauFixture = {
  success: true as const,
  data: {
    columns: daywiseExpectedColumns,
    rows: [
      {
        id: "row-1-85080223",
        slNo: 1,
        meterLookupId: 1095,
        division: "SOUTH",
        zone: "OPH South",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ666",
        consumerName: "M/S LAJWAN STEEL",
        consumerAddress: "27-S-5 JAWAHAR NAGARINDOREINDORE",
        ivrsNumber: "3544019391",
        tariff: "LV1.2",
        meterNumber: daywiseKnownMeter,
        phase: "1 PH",
        mf: 1,
        sanctionedLoadKw: 1,
        ...kwhDays(firstMeterDays),
      },
      {
        id: "row-3-14080992",
        slNo: 3,
        meterLookupId: 1101,
        division: "CENTRAL",
        zone: "Hawabangla",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ666",
        consumerName: "BANGSHI DASADHIKARY S/O BRAJGOPAL DASADHIKARY",
        consumerAddress: "29/S-5 JAWAHAR NAGARRAJENDRA NAGAR ZONEINDORE",
        ivrsNumber: "N3008013530",
        tariff: "LV1.2",
        meterNumber: "14080992",
        phase: "1 PH",
        mf: 1,
        sanctionedLoadKw: 2,
        ...kwhDays(plateauDays),
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 11,
      totalPages: 2,
      totalIsExact: false,
      hasMore: true,
    },
  },
};
