import {
  EXPECTED_CHART_CATEGORIES,
  EXPECTED_CHART_PERIODS,
  alarmsEventsChartData,
} from "./alarms-events-chart.data";

export { EXPECTED_CHART_PERIODS };

export const alarmsEventsCategoryChartData = {
  path: "/indore/alarms-events/category-wise/chart",
  date: alarmsEventsChartData.date,
  maxResponseTime: 120_000,
};

export const EXPECTED_CONSUMER_CATEGORY_LABELS = [
  "Agriculture",
  "School",
  "Commercial",
  "Electric Vehicle",
  "Industrial",
  "Residential",
  "Street Light",
  "Temporary",
  "Unknown",
] as const;

export type AlarmsEventsCategoryChartTestCase = {
  testName: string;
  params: Record<string, string | number>;
  expectedStatus: 200 | 400;
  expectedSlug?: string;
  expectedLabel?: string;
  tags: string[];
};

const tags = ["@alarms-events", "@alarms-events-category-chart", "@edge"];
const smoke = ["@smoke", "@alarms-events", "@alarms-events-category-chart"];

function happyCases(): AlarmsEventsCategoryChartTestCase[] {
  return EXPECTED_CHART_CATEGORIES.map((row) => ({
    testName: `GET /alarms-events/category-wise/chart - ${row.label} consumer mix for ${alarmsEventsCategoryChartData.date}`,
    params: {
      category: row.queryCategory,
      date: alarmsEventsCategoryChartData.date,
    },
    expectedStatus: 200,
    expectedSlug: row.slug,
    expectedLabel: row.label,
    tags: row.smoke ? [...smoke] : [...tags],
  }));
}

export const alarmsEventsCategoryChartTestCases: AlarmsEventsCategoryChartTestCase[] =
  [
    ...happyCases(),
    {
      testName:
        "GET /alarms-events/category-wise/chart - extra unused query is ignored",
      params: {
        category: "Power",
        date: alarmsEventsCategoryChartData.date,
        foo: "1",
      },
      expectedStatus: 200,
      expectedSlug: "power",
      expectedLabel: "Power",
      tags: [...tags],
    },
    {
      testName:
        "GET /alarms-events/category-wise/chart - missing category is rejected",
      params: { date: alarmsEventsCategoryChartData.date },
      expectedStatus: 400,
      tags: [...tags],
    },
    {
      testName:
        "GET /alarms-events/category-wise/chart - missing date is rejected",
      params: { category: "Power" },
      expectedStatus: 400,
      tags: [...tags],
    },
    {
      testName:
        "GET /alarms-events/category-wise/chart - blank category is rejected",
      params: { category: " ", date: alarmsEventsCategoryChartData.date },
      expectedStatus: 400,
      tags: [...tags],
    },
    {
      testName:
        "GET /alarms-events/category-wise/chart - unknown category is rejected",
      params: {
        category: "not-a-category",
        date: alarmsEventsCategoryChartData.date,
      },
      expectedStatus: 400,
      tags: [...tags],
    },
    {
      testName:
        "GET /alarms-events/category-wise/chart - invalid date is rejected",
      params: { category: "Power", date: "23-08-2025" },
      expectedStatus: 400,
      tags: [...tags],
    },
    {
      testName:
        "GET /alarms-events/category-wise/chart - a future date returns empty totals",
      params: { category: "Power", date: "2099-01-01" },
      expectedStatus: 200,
      expectedSlug: "power",
      expectedLabel: "Power",
      tags: [...tags],
    },
  ];
