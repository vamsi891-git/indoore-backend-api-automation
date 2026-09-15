import {
  misGroupingWords,
  misPeriodWords,
} from "./mis-dashboard-titles.data";

export const eventDataQuery = {
  reportType: "phase-wise",
  period: "daily",
  assetType: "all",
};

export const backendRules = {
  reportTypes: ["phase-wise", "category-wise", "priority-wise"],
  periods: ["hourly", "daily", "weekly", "monthly"],
  expectedCategories: [
    "voltage",
    "current",
    "power",
    "transaction",
    "other",
    "non-rollover-control",
  ],
  labelMappings: {
    voltage: "Voltage",
    current: "Current",
    power: "Power",
    transaction: "Transaction",
    other: "Others",
    "non-rollover-control": "NonRollover",
  },
  priorityIds: [0, 1, 2, 3, 4, 5, 6],
};

export type EventDataTestCase = {
  testName: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  expectedReportType?: string;
  tags: string[];
};

const tags = ["@mis-dashboard", "@event-data", "@edge"];
const smoke = ["@smoke", "@event-data", "@mis-dashboard"];
const title = "Event summary";

const reportTypes = ["phase-wise", "category-wise", "priority-wise"] as const;
const periods = ["hourly", "daily", "weekly", "monthly"] as const;
const assets = [
  { assetType: "all", words: "all meters" },
  { assetType: "consumer", words: "consumer meters only" },
  { assetType: "dtr", words: "DTR meters only" },
] as const;

function happyCases(): EventDataTestCase[] {
  const cases: EventDataTestCase[] = [];
  for (const reportType of reportTypes) {
    for (const period of periods) {
      for (const asset of assets) {
        const isSmoke =
          reportType === "phase-wise" &&
          period === "daily" &&
          asset.assetType === "all";
        cases.push({
          testName: `${title} — ${misGroupingWords(reportType)}, ${misPeriodWords(period)}, ${asset.words}`,
          params: { reportType, period, assetType: asset.assetType },
          expectedStatus: 200,
          expectedReportType: reportType,
          tags: isSmoke ? smoke : tags,
        });
      }
    }
  }
  return cases;
}

export const eventDataTestCases: EventDataTestCase[] = [
  ...happyCases(),
  {
    testName: `${title} — both is treated as all meters`,
    params: { reportType: "phase-wise", period: "daily", assetType: "both" },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    tags,
  },
  {
    testName: `${title} — consumers is treated as consumer meters`,
    params: {
      reportType: "phase-wise",
      period: "daily",
      assetType: "consumers",
    },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    tags,
  },
  {
    testName: `${title} — dtrs is treated as DTR meters`,
    params: { reportType: "phase-wise", period: "daily", assetType: "dtrs" },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    tags,
  },
  {
    testName: `${title} — extra unused options are ignored`,
    params: {
      reportType: "phase-wise",
      period: "daily",
      assetType: "all",
      foo: "1",
    },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    tags,
  },
  {
    testName: `${title} — an invalid time range is rejected`,
    params: { reportType: "phase-wise", period: "invalid_period", assetType: "all" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: `${title} — an invalid grouping is rejected`,
    params: { reportType: "not-a-type", period: "daily" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: `${title} — a blank grouping is rejected`,
    params: { reportType: " ", period: "daily" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: `${title} — a missing grouping is rejected`,
    params: { period: "daily", assetType: "all" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: `${title} — organisation 0 is rejected`,
    params: {
      reportType: "phase-wise",
      period: "daily",
      organisationLookupId: 0,
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: `${title} — network 0 is rejected`,
    params: { reportType: "phase-wise", period: "daily", networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
