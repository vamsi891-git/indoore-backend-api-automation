export const commStatsQuery = {
  fromDate: "2025-10-01",
  toDate: "2025-10-30",
  assetType: "all",
};

export const EXPECTED_COMMUNICATION_CATEGORIES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Agriculture",
  "School",
  "Street Light",
  "Temporary",
  "Electric Vehicle",
  "Unknown",
];

export const EXPECTED_COMMUNICATION_PHASES = [
  "1 PH",
  "3PH 4CT",
  "3PH WC",
  "HT",
  "Unknown",
];

export type CommunicationScenario =
  | "happy_all"
  | "asset_consumer"
  | "asset_dtr"
  | "asset_both_alias"
  | "asset_consumers_alias"
  | "asset_dtrs_alias"
  | "asset_unknown_defaults_all"
  | "live_true"
  | "live_one"
  | "from_to_snake"
  | "from_to_kebab"
  | "ignore_unknown_query"
  | "missing_end_date"
  | "missing_start_date"
  | "missing_both_dates"
  | "blank_dates_default_today"
  | "same_day"
  | "swapped_dates"
  | "invalid_date"
  | "wrong_date_format"
  | "org_zero"
  | "org_negative"
  | "network_zero";

export type CommunicationTestCase = {
  testName: string;
  scenario: CommunicationScenario;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  expectedFromDate?: string;
  expectedToDate?: string;
  expectSameDayWindow?: boolean;
  checkExpectedLabels?: boolean;
  checkChartMembership?: boolean;
  tags: string[];
};

const tags = ["@mis-dashboard", "@comm-stats", "@edge"];
const smoke = ["@smoke", "@mis-dashboard", "@comm-stats"];

export const communicationTestCases: CommunicationTestCase[] = [
  {
    testName: "How meters are talking — all meters, 1 to 30 Oct 2025",
    scenario: "happy_all",
    params: { ...commStatsQuery },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    tags: smoke,
  },
  {
    testName: "How meters are talking — consumer meters only",
    scenario: "asset_consumer",
    params: { ...commStatsQuery, assetType: "consumer" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "How meters are talking — DTR meters only",
    scenario: "asset_dtr",
    params: { ...commStatsQuery, assetType: "dtr" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "How meters are talking — both is treated as all meters",
    scenario: "asset_both_alias",
    params: { ...commStatsQuery, assetType: "both" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    tags,
  },
  {
    testName: "How meters are talking — consumers is treated as consumer meters",
    scenario: "asset_consumers_alias",
    params: { ...commStatsQuery, assetType: "consumers" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "How meters are talking — dtrs is treated as DTR meters",
    scenario: "asset_dtrs_alias",
    params: { ...commStatsQuery, assetType: "dtrs" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "How meters are talking — unknown meter kind is treated as all",
    scenario: "asset_unknown_defaults_all",
    params: { ...commStatsQuery, assetType: "transformers" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    tags,
  },
  {
    testName: "How meters are talking — live view still opens",
    scenario: "live_true",
    params: { ...commStatsQuery, live: "true" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    checkChartMembership: false,
    tags,
  },
  {
    testName: "How meters are talking — live=1 still opens",
    scenario: "live_one",
    params: { ...commStatsQuery, live: "1" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    checkChartMembership: false,
    tags,
  },
  {
    testName: "How meters are talking — from_date and to_date still work",
    scenario: "from_to_snake",
    params: {
      from_date: commStatsQuery.fromDate,
      to_date: commStatsQuery.toDate,
      assetType: "all",
    },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    tags,
  },
  {
    testName: "How meters are talking — from-date and to-date still work",
    scenario: "from_to_kebab",
    params: {
      "from-date": commStatsQuery.fromDate,
      "to-date": commStatsQuery.toDate,
      "asset-type": "all",
    },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    tags,
  },
  {
    testName: "How meters are talking — extra unused options are ignored",
    scenario: "ignore_unknown_query",
    params: { ...commStatsQuery, foo: "1", kind: "ignored" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.toDate,
    tags,
  },
  {
    testName: "How meters are talking — missing end date uses the start date",
    scenario: "missing_end_date",
    params: { fromDate: commStatsQuery.fromDate, assetType: "all" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.fromDate,
    tags,
  },
  {
    testName: "How meters are talking — missing start date uses the end date",
    scenario: "missing_start_date",
    params: { toDate: commStatsQuery.toDate, assetType: "all" },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.toDate,
    expectedToDate: commStatsQuery.toDate,
    tags,
  },
  {
    testName: "How meters are talking — no dates uses today",
    scenario: "missing_both_dates",
    params: { assetType: "all" },
    expectedStatus: 200,
    expectSameDayWindow: true,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "How meters are talking — blank dates are treated as missing",
    scenario: "blank_dates_default_today",
    params: { fromDate: "", toDate: "", assetType: "all" },
    expectedStatus: 200,
    expectSameDayWindow: true,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "How meters are talking — one day only still opens",
    scenario: "same_day",
    params: {
      fromDate: commStatsQuery.fromDate,
      toDate: commStatsQuery.fromDate,
      assetType: "all",
    },
    expectedStatus: 200,
    expectedFromDate: commStatsQuery.fromDate,
    expectedToDate: commStatsQuery.fromDate,
    tags,
  },
  {
    testName: "How meters are talking — start date after end date is rejected",
    scenario: "swapped_dates",
    params: {
      fromDate: commStatsQuery.toDate,
      toDate: commStatsQuery.fromDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How meters are talking — a bad date is rejected",
    scenario: "invalid_date",
    params: {
      fromDate: "not-a-date",
      toDate: commStatsQuery.toDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How meters are talking — day-month-year date is rejected",
    scenario: "wrong_date_format",
    params: {
      fromDate: "01-10-2025",
      toDate: "30-10-2025",
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How meters are talking — organisation 0 is rejected",
    scenario: "org_zero",
    params: { ...commStatsQuery, organisationLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How meters are talking — a negative organisation is rejected",
    scenario: "org_negative",
    params: { ...commStatsQuery, organisationLookupId: -1 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How meters are talking — network 0 is rejected",
    scenario: "network_zero",
    params: { ...commStatsQuery, networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
