export const communicationTrendQuery = {
  fromDate: "2025-10-01",
  toDate: "2025-10-30",
  assetType: "all",
};

export type CommunicationTrendTestCase = {
  testName: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  expectedFromDate?: string;
  expectedToDate?: string;
  expectSameDayWindow?: boolean;
  expectZeroCounts?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@mis-dashboard", "@edge"];
const smoke = ["@smoke", "@mis-dashboard"];
const query = communicationTrendQuery;

export const communicationTrendTestCases: CommunicationTrendTestCase[] = [
  {
    testName: "Daily talking chart — all meters, 1 to 30 Oct 2025",
    params: { ...query },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags: smoke,
  },
  {
    testName: "Daily talking chart — consumer meters only",
    params: { ...query, assetType: "consumer" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — DTR meters only",
    params: { ...query, assetType: "dtr" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    expectZeroCounts: true,
    tags,
  },
  {
    testName: "Daily talking chart — both is treated as all meters",
    params: { ...query, assetType: "both" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — consumers is treated as consumer meters",
    params: { ...query, assetType: "consumers" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — dtrs is treated as DTR meters",
    params: { ...query, assetType: "dtrs" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    expectZeroCounts: true,
    tags,
  },
  {
    testName: "Daily talking chart — unknown meter kind is treated as all",
    params: { ...query, assetType: "transformers" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — live view still opens",
    params: { ...query, live: "true" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — live=1 still opens",
    params: { ...query, live: "1" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — from_date and to_date still work",
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
    testName: "Daily talking chart — from-date and to-date still work",
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
    testName: "Daily talking chart — extra unused options are ignored",
    params: { ...query, foo: "1" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — missing end date uses the start date",
    params: { fromDate: query.fromDate, assetType: "all" },
    expectedStatus: 200,
    expectedFromDate: query.fromDate,
    expectedToDate: query.fromDate,
    tags,
  },
  {
    testName: "Daily talking chart — missing start date uses the end date",
    params: { toDate: query.toDate, assetType: "all" },
    expectedStatus: 200,
    expectedFromDate: query.toDate,
    expectedToDate: query.toDate,
    tags,
  },
  {
    testName: "Daily talking chart — no dates uses today",
    params: { assetType: "all" },
    expectedStatus: 200,
    expectSameDayWindow: true,
    tags,
  },
  {
    testName: "Daily talking chart — blank dates are treated as missing",
    params: { fromDate: "", toDate: "", assetType: "all" },
    expectedStatus: 200,
    expectSameDayWindow: true,
    tags,
  },
  {
    testName: "Daily talking chart — one day only still opens",
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
    testName: "Daily talking chart — start date after end date is rejected",
    params: {
      fromDate: query.toDate,
      toDate: query.fromDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Daily talking chart — a bad date is rejected",
    params: {
      fromDate: "not-a-date",
      toDate: query.toDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Daily talking chart — day-month-year date is rejected",
    params: {
      fromDate: "01-10-2025",
      toDate: "30-10-2025",
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Daily talking chart — organisation 0 is rejected",
    params: { ...query, organisationLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Daily talking chart — a negative organisation is rejected",
    params: { ...query, organisationLookupId: -1 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Daily talking chart — network 0 is rejected",
    params: { ...query, networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
