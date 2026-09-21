import { EXPECTED_CHART_CATEGORIES, alarmsEventsChartData } from "./alarms-events-chart.data";
import { EXPECTED_PHASE_DRILL_COLUMNS } from "./alarms-events-phase-drill.data";

export const alarmsEventsPriorityDrillData = {
  path: "/indore/alarms-events/priority-wise/drill-down",
  date: alarmsEventsChartData.date,
  series: "3PH WC",
  maxResponseTime: 120_000,
};

export const EXPECTED_PRIORITY_DRILL_COLUMNS = EXPECTED_PHASE_DRILL_COLUMNS;

export const EXPECTED_PRIORITY_DRILL_PRIORITIES = [
  { query: "Active", slug: "active" },
  { query: "Resolved", slug: "resolved", smoke: true },
  { query: "Priority 1", slug: "priority-1" },
  { query: "Priority 2", slug: "priority-2" },
  { query: "Priority 3", slug: "priority-3" },
  { query: "Priority 4", slug: "priority-4" },
  { query: "Priority 5", slug: "priority-5" },
  { query: "Priority 6", slug: "priority-6" },
] as const;

export type AlarmsEventsPriorityDrillTestCase = {
  testName: string;
  params: Record<string, string | number>;
  expectedStatus: 200 | 400;
  expectedPrioritySlug?: string;
  expectedCategorySlug?: string;
  expectedLabel?: string;
  expectedSeries?: string;
  expectedDate?: string;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@alarms-events", "@alarms-events-priority-drill", "@edge"];
const smoke = ["@smoke", "@alarms-events", "@alarms-events-priority-drill"];

const power = EXPECTED_CHART_CATEGORIES[0];

function priorityCases(): AlarmsEventsPriorityDrillTestCase[] {
  return EXPECTED_PRIORITY_DRILL_PRIORITIES.map((row) => ({
    testName: `GET /alarms-events/priority-wise/drill-down - ${row.query} + Power for ${alarmsEventsPriorityDrillData.series}`,
    params: {
      priority: row.query,
      category: power.queryCategory,
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 200,
    expectedPrioritySlug: row.slug,
    expectedCategorySlug: power.slug,
    expectedLabel: power.label,
    tags: "smoke" in row && row.smoke ? [...smoke] : [...tags],
  }));
}

function categoryCases(): AlarmsEventsPriorityDrillTestCase[] {
  return EXPECTED_CHART_CATEGORIES.filter((row) => row.slug !== "power").map((row) => ({
    testName: `GET /alarms-events/priority-wise/drill-down - Resolved + ${row.label} for ${alarmsEventsPriorityDrillData.series}`,
    params: {
      priority: "Resolved",
      category: row.queryCategory,
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    expectedCategorySlug: row.slug,
    expectedLabel: row.label,
    tags: [...tags],
    nonEmptyExpected: false,
  }));
}

export const alarmsEventsPriorityDrillTestCases: AlarmsEventsPriorityDrillTestCase[] = [
  ...priorityCases(),
  ...categoryCases(),
  {
    testName: "GET /alarms-events/priority-wise/drill-down - Resolved + Power for 1 PH",
    params: {
      priority: "Resolved",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: "1 PH",
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    expectedCategorySlug: "power",
    expectedLabel: "Power",
    expectedSeries: "1 PH",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - Resolved + Power for 3PH 4CT",
    params: {
      priority: "Resolved",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: "3PH 4CT",
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    expectedCategorySlug: "power",
    expectedLabel: "Power",
    expectedSeries: "3PH 4CT",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - extra unused query is ignored",
    params: {
      priority: "Resolved",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
      foo: "1",
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    expectedCategorySlug: "power",
    expectedLabel: "Power",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - missing priority is rejected",
    params: {
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName:
      "GET /alarms-events/priority-wise/drill-down - missing category returns all classifications",
    params: {
      priority: "Resolved",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - missing date is rejected",
    params: {
      priority: "Resolved",
      category: "Power",
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - missing series returns empty rows",
    params: {
      priority: "Resolved",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    expectedCategorySlug: "power",
    expectedLabel: "Power",
    expectedSeries: "",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - blank priority is rejected",
    params: {
      priority: " ",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName:
      "GET /alarms-events/priority-wise/drill-down - blank category returns all classifications",
    params: {
      priority: "Resolved",
      category: " ",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - unknown priority is rejected",
    params: {
      priority: "Priority 99",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - Priority 0 is rejected",
    params: {
      priority: "Priority 0",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - unknown category is rejected",
    params: {
      priority: "Resolved",
      category: "not-a-category",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - invalid date is rejected",
    params: {
      priority: "Resolved",
      category: "Power",
      date: "23-08-2025",
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - blank series returns empty rows",
    params: {
      priority: "Resolved",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: " ",
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    expectedCategorySlug: "power",
    expectedLabel: "Power",
    expectedSeries: "",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - page 0 is rejected",
    params: {
      priority: "Resolved",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
      page: 0,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - limit 0 is rejected",
    params: {
      priority: "Resolved",
      category: "Power",
      date: alarmsEventsPriorityDrillData.date,
      series: alarmsEventsPriorityDrillData.series,
      limit: 0,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/drill-down - a future date returns empty rows",
    params: {
      priority: "Resolved",
      category: "Power",
      date: "2099-01-01",
      series: alarmsEventsPriorityDrillData.series,
    },
    expectedStatus: 200,
    expectedPrioritySlug: "resolved",
    expectedCategorySlug: "power",
    expectedLabel: "Power",
    expectedDate: "2099-01-01",
    tags: [...tags],
    nonEmptyExpected: false,
  },
];
