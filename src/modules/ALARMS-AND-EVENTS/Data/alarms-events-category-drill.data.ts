import { EXPECTED_CHART_CATEGORIES, alarmsEventsChartData } from "./alarms-events-chart.data";
import { EXPECTED_PHASE_DRILL_COLUMNS } from "./alarms-events-phase-drill.data";

export const alarmsEventsCategoryDrillData = {
  path: "/indore/alarms-events/category-wise/drill-down",
  date: alarmsEventsChartData.date,
  series: "3PH WC",
  maxResponseTime: 120_000,
};

export const EXPECTED_CATEGORY_DRILL_COLUMNS = EXPECTED_PHASE_DRILL_COLUMNS;

export type AlarmsEventsCategoryDrillTestCase = {
  testName: string;
  params: Record<string, string | number>;
  expectedStatus: 200 | 400;
  expectedSlug?: string;
  expectedLabel?: string;
  expectedSeries?: string;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@alarms-events", "@alarms-events-category-drill", "@edge"];
const smoke = ["@smoke", "@alarms-events", "@alarms-events-category-drill"];

function happyCases(): AlarmsEventsCategoryDrillTestCase[] {
  return EXPECTED_CHART_CATEGORIES.map((row) => ({
    testName: `GET /alarms-events/category-wise/drill-down - ${row.label} for ${alarmsEventsCategoryDrillData.series}`,
    params: {
      category: row.queryCategory,
      date: alarmsEventsCategoryDrillData.date,
      series: alarmsEventsCategoryDrillData.series,
    },
    expectedStatus: 200,
    expectedSlug: row.slug,
    expectedLabel: row.label,
    tags: row.smoke ? [...smoke] : [...tags],
  }));
}

export const alarmsEventsCategoryDrillTestCases: AlarmsEventsCategoryDrillTestCase[] = [
  ...happyCases(),
  {
    testName: "GET /alarms-events/category-wise/drill-down - Power for 1 PH",
    params: {
      category: "Power",
      date: alarmsEventsCategoryDrillData.date,
      series: "1 PH",
    },
    expectedStatus: 200,
    expectedSlug: "power",
    expectedLabel: "Power",
    expectedSeries: "1 PH",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - Power for 3PH 4CT",
    params: {
      category: "Power",
      date: alarmsEventsCategoryDrillData.date,
      series: "3PH 4CT",
    },
    expectedStatus: 200,
    expectedSlug: "power",
    expectedLabel: "Power",
    expectedSeries: "3PH 4CT",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - extra unused query is ignored",
    params: {
      category: "Power",
      date: alarmsEventsCategoryDrillData.date,
      series: alarmsEventsCategoryDrillData.series,
      foo: "1",
    },
    expectedStatus: 200,
    expectedSlug: "power",
    expectedLabel: "Power",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - missing category is rejected",
    params: {
      date: alarmsEventsCategoryDrillData.date,
      series: alarmsEventsCategoryDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - missing date is rejected",
    params: {
      category: "Power",
      series: alarmsEventsCategoryDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - missing series returns empty rows",
    params: {
      category: "Power",
      date: alarmsEventsCategoryDrillData.date,
    },
    expectedStatus: 200,
    expectedSlug: "power",
    expectedLabel: "Power",
    expectedSeries: "",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - blank category is rejected",
    params: {
      category: " ",
      date: alarmsEventsCategoryDrillData.date,
      series: alarmsEventsCategoryDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - unknown category is rejected",
    params: {
      category: "not-a-category",
      date: alarmsEventsCategoryDrillData.date,
      series: alarmsEventsCategoryDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - invalid date is rejected",
    params: {
      category: "Power",
      date: "23-08-2025",
      series: alarmsEventsCategoryDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - blank series returns empty rows",
    params: {
      category: "Power",
      date: alarmsEventsCategoryDrillData.date,
      series: " ",
    },
    expectedStatus: 200,
    expectedSlug: "power",
    expectedLabel: "Power",
    expectedSeries: "",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - page 0 is rejected",
    params: {
      category: "Power",
      date: alarmsEventsCategoryDrillData.date,
      series: alarmsEventsCategoryDrillData.series,
      page: 0,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/category-wise/drill-down - limit 0 is rejected",
    params: {
      category: "Power",
      date: alarmsEventsCategoryDrillData.date,
      series: alarmsEventsCategoryDrillData.series,
      limit: 0,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
];
