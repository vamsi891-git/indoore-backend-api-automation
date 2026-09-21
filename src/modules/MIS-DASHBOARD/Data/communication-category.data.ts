export const communicationCategoryQuery = {
  fromDate: "2025-10-01",
  toDate: "2026-10-30",
  assetType: "all",
};

export const EXPECTED_COMMUNICATION_CATEGORY_LABELS = [
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

export type CommunicationCategoryTestCase = {
  testName: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  expectedFromDate?: string;
  expectedToDate?: string;
  expectSameDayWindow?: boolean;
  checkExpectedLabels?: boolean;
  expectZeroCounts?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@mis-dashboard", "@edge"];
const smoke = ["@smoke", "@mis-dashboard"];
const query = communicationCategoryQuery;

export const communicationCategoryTestCases: CommunicationCategoryTestCase[] = [
  {
    testName: "Talking meters by category — all meters, Oct 2025 to Oct 2026",
    params: { ...query },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags: smoke,
  },
  {
    testName: "Talking meters by category — consumer meters only",
    params: { ...query, assetType: "consumer" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — DTR meters only",
    params: { ...query, assetType: "dtr" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    expectZeroCounts: true,
    tags,
  },
  {
    testName: "Talking meters by category — both is treated as all meters",
    params: { ...query, assetType: "both" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — consumers is treated as consumer meters",
    params: { ...query, assetType: "consumers" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — dtrs is treated as DTR meters",
    params: { ...query, assetType: "dtrs" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    expectZeroCounts: true,
    tags,
  },
  {
    testName: "Talking meters by category — unknown meter kind is treated as all",
    params: { ...query, assetType: "transformers" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — live view still opens",
    params: { ...query, live: "true" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "Talking meters by category — live=1 still opens",
    params: { ...query, live: "1" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "Talking meters by category — from_date and to_date still work",
    params: {
      from_date: query.fromDate,
      to_date: query.toDate,
      assetType: "all",
    },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — from-date and to-date still work",
    params: {
      "from-date": query.fromDate,
      "to-date": query.toDate,
      "asset-type": "all",
    },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — extra unused options are ignored",
    params: { ...query, foo: "1" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — missing end date uses the start date",
    params: { fromDate: query.fromDate, assetType: "all" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.fromDate,
    tags,
  },
  {
    testName: "Talking meters by category — missing start date uses the end date",
    params: { toDate: query.toDate, assetType: "all" },
    expectedStatus: 200,
    expectedFromDate: query.toDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Talking meters by category — no dates uses today",
    params: { assetType: "all" },
    expectedStatus: 200,
    expectSameDayWindow: true,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "Talking meters by category — blank dates are treated as missing",
    params: { fromDate: "", toDate: "", assetType: "all" },
    expectedStatus: 200,
    expectSameDayWindow: true,
    checkExpectedLabels: false,
    tags,
  },
  {
    testName: "Talking meters by category — one day only still opens",
    params: {
      fromDate: query.fromDate,
      toDate: query.fromDate,
      assetType: "all",
    },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.fromDate,
    tags,
  },
  {
    testName: "Talking meters by category — start date after end date is rejected",
    params: {
      fromDate: query.toDate,
      toDate: query.fromDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Talking meters by category — a bad date is rejected",
    params: {
      fromDate: "not-a-date",
      toDate: query.toDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Talking meters by category — day-month-year date is rejected",
    params: {
      fromDate: "01-10-2025",
      toDate: "30-10-2026",
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Talking meters by category — organisation 0 is rejected",
    params: { ...query, organisationLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Talking meters by category — a negative organisation is rejected",
    params: { ...query, organisationLookupId: -1 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Talking meters by category — network 0 is rejected",
    params: { ...query, networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
