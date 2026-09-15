import {
  misGroupingWords,
  misPeriodWords,
} from "./mis-dashboard-titles.data";

export const eventVoltageQuery = {
  reportType: "phase-wise",
  period: "daily",
  assetType: "all",
};

export const backendRules = {
  reportTypes: ["phase-wise", "category-wise"],
  periods: ["hourly", "daily", "weekly", "monthly"],
  phaseLabels: ["1 PH", "3PH 4CT", "3PH WC", "HT"],
  categoryLabels: [
    "Agriculture",
    "Commercial",
    "Electric Vehicle",
    "Electric Vehicle Charging Station",
    "Industrial",
    "Residential",
    "School",
    "Street Light",
    "Temporary",
    "Unknown",
  ],
  trendRegex: {
    hourly: /^\d{2}:\d{2}$/,
    daily: /^\d{4}-\d{2}-\d{2}$/,
    weekly: /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/,
    monthly: /^\d{4}-\d{2}$/,
  },
};

export const eventVoltageQueries = [
  { reportType: "phase-wise", period: "hourly" },
  { reportType: "phase-wise", period: "daily" },
  { reportType: "phase-wise", period: "weekly" },
  { reportType: "phase-wise", period: "monthly" },
  { reportType: "category-wise", period: "daily" },
];

export type EventVoltageTestCase = {
  testName: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  expectedReportType?: string;
  expectedPeriod?: string;
  tags: string[];
};

const tags = ["@mis-dashboard", "@event-data", "@edge"];
const smoke = ["@smoke", "@event-data", "@mis-dashboard"];

const reportTypes = ["phase-wise", "category-wise"] as const;
const periods = ["hourly", "daily", "weekly", "monthly"] as const;
const assets = [
  { assetType: "all", words: "all meters" },
  { assetType: "consumer", words: "consumer meters only" },
  { assetType: "dtr", words: "DTR meters only" },
] as const;

function happyCases(): EventVoltageTestCase[] {
  const cases: EventVoltageTestCase[] = [];
  for (const reportType of reportTypes) {
    for (const period of periods) {
      for (const asset of assets) {
        const isSmoke =
          reportType === "phase-wise" &&
          period === "daily" &&
          asset.assetType === "all";
        cases.push({
          testName: `Voltage problems — ${misGroupingWords(reportType)}, ${misPeriodWords(period)}, ${asset.words}`,
          params: { reportType, period, assetType: asset.assetType },
          expectedStatus: 200,
          expectedReportType: reportType,
          expectedPeriod: period,
          tags: isSmoke ? smoke : tags,
        });
      }
    }
  }
  return cases;
}

export const eventVoltageTestCases: EventVoltageTestCase[] = [
  ...happyCases(),
  {
    testName: "Voltage problems — both is treated as all meters",
    params: { reportType: "phase-wise", period: "daily", assetType: "both" },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    expectedPeriod: "daily",
    tags,
  },
  {
    testName: "Voltage problems — consumers is treated as consumer meters",
    params: {
      reportType: "phase-wise",
      period: "daily",
      assetType: "consumers",
    },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    expectedPeriod: "daily",
    tags,
  },
  {
    testName: "Voltage problems — dtrs is treated as DTR meters",
    params: { reportType: "phase-wise", period: "daily", assetType: "dtrs" },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    expectedPeriod: "daily",
    tags,
  },
  {
    testName: "Voltage problems — extra unused options are ignored",
    params: {
      reportType: "phase-wise",
      period: "daily",
      assetType: "all",
      foo: "1",
    },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    expectedPeriod: "daily",
    tags,
  },
  {
    testName: "Voltage problems — an invalid time range is rejected",
    params: { reportType: "phase-wise", period: "invalid_period" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Voltage problems — an invalid grouping is rejected",
    params: { reportType: "not-a-type", period: "daily" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Voltage problems — a blank time range is rejected",
    params: { reportType: "phase-wise", period: " " },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Voltage problems — a missing grouping is rejected",
    params: { period: "daily", assetType: "all" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Voltage problems — organisation 0 is rejected",
    params: {
      reportType: "phase-wise",
      period: "daily",
      organisationLookupId: 0,
    },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "Voltage problems — network 0 is rejected",
    params: { reportType: "phase-wise", period: "daily", networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
