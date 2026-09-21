export const commStatsQuery = {
  fromDate: "2025-10-01",
  toDate: "2025-10-30",
  assetType: "all",
};

export type CommStatsTestCase = {
  testName: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@mis-dashboard", "@comm-stats", "@edge"];
const smoke = ["@smoke", "@comm-stats", "@mis-dashboard"];
const query = commStatsQuery;

export const commStatsTestCases: CommStatsTestCase[] = [
  {
    testName: "How many meters we have — all meters",
    params: { ...query },
    expectedStatus: 200,
    tags: smoke,
  },
  {
    testName: "How many meters we have — consumer meters only",
    params: { ...query, assetType: "consumer" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — DTR meters only",
    params: { ...query, assetType: "dtr" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — both is treated as all meters",
    params: { ...query, assetType: "both" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — consumers is treated as consumer meters",
    params: { ...query, assetType: "consumers" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — dtrs is treated as DTR meters",
    params: { ...query, assetType: "dtrs" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — unknown meter kind is treated as all",
    params: { ...query, assetType: "transformers" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — live view still opens",
    params: { ...query, live: "true" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — live=1 still opens",
    params: { ...query, live: "1" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — from_date and to_date still work",
    params: {
      from_date: query.fromDate,
      to_date: query.toDate,
      assetType: "all",
    },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — from-date and to-date still work",
    params: {
      "from-date": query.fromDate,
      "to-date": query.toDate,
      "asset-type": "all",
    },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — extra unused options are ignored",
    params: { ...query, foo: "1" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — missing end date still opens",
    params: { fromDate: query.fromDate, assetType: "all" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — missing start date still opens",
    params: { toDate: query.toDate, assetType: "all" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — no dates still opens",
    params: { assetType: "all" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — blank dates are treated as missing",
    params: { fromDate: "", toDate: "", assetType: "all" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — one day only still opens",
    params: {
      fromDate: query.fromDate,
      toDate: query.fromDate,
      assetType: "all",
    },
    expectedStatus: 200,
    tags,
  },
  {
    testName: "How many meters we have — start date after end date is rejected",
    params: {
      fromDate: query.toDate,
      toDate: query.fromDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How many meters we have — a bad date is rejected",
    params: {
      fromDate: "not-a-date",
      toDate: query.toDate,
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How many meters we have — day-month-year date is rejected",
    params: {
      fromDate: "01-10-2025",
      toDate: "30-10-2025",
      assetType: "all",
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How many meters we have — organisation 0 is rejected",
    params: { ...query, organisationLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How many meters we have — a negative organisation is rejected",
    params: { ...query, organisationLookupId: -1 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "How many meters we have — network 0 is rejected",
    params: { ...query, networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
