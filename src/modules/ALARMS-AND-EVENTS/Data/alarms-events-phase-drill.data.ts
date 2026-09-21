import { EXPECTED_CHART_CATEGORIES, alarmsEventsChartData } from "./alarms-events-chart.data";

export const alarmsEventsPhaseDrillData = {
  path: "/indore/alarms-events/phase-wise/drill-down",
  date: alarmsEventsChartData.date,
  series: "3PH WC",
  maxResponseTime: 120_000,
};

export const EXPECTED_PHASE_DRILL_COLUMNS = [
  { key: "circleId", header: "Circle ID" },
  { key: "circleName", header: "Circle" },
  { key: "eventName", header: "Event Name" },
  { key: "eventClassificationName", header: "Event Classification Name" },
  { key: "meterCount", header: "Meter Count" },
  { key: "eventCount", header: "Event Count" },
  { key: "duration", header: "Duration" },
] as const;

export type AlarmsEventsPhaseDrillTestCase = {
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

const tags = ["@alarms-events", "@alarms-events-phase-drill", "@edge"];
const smoke = ["@smoke", "@alarms-events", "@alarms-events-phase-drill"];

function happyCases(): AlarmsEventsPhaseDrillTestCase[] {
  return EXPECTED_CHART_CATEGORIES.map((row) => ({
    testName: `GET /alarms-events/phase-wise/drill-down - ${row.label} for ${alarmsEventsPhaseDrillData.series}`,
    params: {
      category: row.queryCategory,
      date: alarmsEventsPhaseDrillData.date,
      series: alarmsEventsPhaseDrillData.series,
    },
    expectedStatus: 200,
    expectedSlug: row.slug,
    expectedLabel: row.label,
    tags: row.smoke ? [...smoke] : [...tags],
  }));
}

export const alarmsEventsPhaseDrillTestCases: AlarmsEventsPhaseDrillTestCase[] = [
  ...happyCases(),
  {
    testName: "GET /alarms-events/phase-wise/drill-down - extra unused query is ignored",
    params: {
      category: "Power",
      date: alarmsEventsPhaseDrillData.date,
      series: alarmsEventsPhaseDrillData.series,
      foo: "1",
    },
    expectedStatus: 200,
    expectedSlug: "power",
    expectedLabel: "Power",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/phase-wise/drill-down - missing category is rejected",
    params: {
      date: alarmsEventsPhaseDrillData.date,
      series: alarmsEventsPhaseDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/phase-wise/drill-down - missing date is rejected",
    params: {
      category: "Power",
      series: alarmsEventsPhaseDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/phase-wise/drill-down - missing series returns empty rows",
    params: {
      category: "Power",
      date: alarmsEventsPhaseDrillData.date,
    },
    expectedStatus: 200,
    expectedSlug: "power",
    expectedLabel: "Power",
    expectedSeries: "",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/phase-wise/drill-down - blank category is rejected",
    params: {
      category: " ",
      date: alarmsEventsPhaseDrillData.date,
      series: alarmsEventsPhaseDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/phase-wise/drill-down - unknown category is rejected",
    params: {
      category: "not-a-category",
      date: alarmsEventsPhaseDrillData.date,
      series: alarmsEventsPhaseDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/phase-wise/drill-down - invalid date is rejected",
    params: {
      category: "Power",
      date: "23-08-2025",
      series: alarmsEventsPhaseDrillData.series,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
];
