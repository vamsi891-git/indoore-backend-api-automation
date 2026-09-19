export const alarmsEventsChartData = {
  path: '/indore/alarms-events/chart',
  date:"2025-08-23",
  maxResponseTime: 120_000,
}
export const EXPECTED_CHART_PERIODS = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
] as const;

export const EXPECTED_CHART_PHASES = ["1 PH","3PH WC","3PH 4CT"] as const;
export const EXPECTED_CHART_CATEGORIES = [
  {
    queryCategory : "Power",
    slug: "power",
    label: "Power",
    smoke:true,
  },
  {
    queryCategory: "Current",
    slug: "current",
    label: "Current",
    smoke:false,
  },
  {
    queryCategory: "Voltage",
    slug: "voltage",
    label: "Voltage",
    smoke:false,
  },
  {
    queryCategory: "Transaction",
    slug: "transaction",
    label: "Transaction",
    smoke:false,
  },
  {
    queryCategory: "Other",
    slug: "other",
    label: "Others",
    smoke:false,
  },
  {
    queryCategory : "Non Rollover Control",
    slug: "non-rollover-control",
    label: "NonRollover",
    smoke:false,
    }
] as const;

export type AlarmsEventsChartTestCase = {
  testName: string;
  params:Record<string,string | number >;
  expectedStatus: 200 |400;
  expectedSlug?: string;
  expectedLabel?: string;
  tags: string[];
}
const tags = ["@alarms-events","@alarms-events-chart","@edge"];
const smoke = ["@smoke","@alarms-events","@alarms-events-chart"];


export const alarmsEventsChartTestCases: AlarmsEventsChartTestCase[] = [
  ...EXPECTED_CHART_CATEGORIES.map((row)=>  ({
      testName: `GET /alarms-events/chart - ${row.label} phase mix for ${alarmsEventsChartData.date}`,
      params: {
        category: row.queryCategory,
        date: alarmsEventsChartData.date,
      },
      expectedStatus: 200 as const,
      expectedSlug:row.slug,
      expectedLabel:row.label,
      tags: row.smoke ? smoke :tags,
  })),
  {
    testName : "GET /alarms-events/chart - extra unused query is ignored",
    params: {
      category: "Power",
      date: alarmsEventsChartData.date,
      foo : "1",
    },
    expectedStatus: 200 as const,
    expectedSlug: "power",
    expectedLabel: "Power",
    tags,
  },
  {
    testName: "GET /alarms-events/chart - missing category is rejected",
    params: {date:alarmsEventsChartData.date},
    expectedStatus: 400,
    tags
  },
  {
    testName: "GET /alarms-events/chart - missing date is rejected",
    params: {category: "Power"},
    expectedStatus: 400,
    tags,
  },
  {
    testName: "GET /alarms-events/chart - blank category is rejected",
    params: {category: "",date: alarmsEventsChartData.date},
    expectedStatus: 400,
    tags,
  },
  {
    testName: "GET /alarms-events/chart - unknown category is rejected",
    params: {category: "not-a-category",date: alarmsEventsChartData.date},
    expectedStatus: 400,
    tags,
  },
  {
    testName: "GET /alarms-events/chart - invalid date format is rejected",
    params: {category: "Power",date: "23-08-2025"},
    expectedStatus: 400,
    tags,
  },
  {
    testName: "GET /alarms-events/chart - a future date returns empty phase totals",
    params: {
      category: "Power",
      date: "2099-01-01",
    },
    expectedStatus: 200 as const,
    expectedSlug: "power",
    expectedLabel: "Power",
    tags,
  },
];