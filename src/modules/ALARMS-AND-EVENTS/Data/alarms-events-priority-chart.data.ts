import { EXPECTED_CHART_PERIODS } from "./alarms-events-chart.data";
import {
  EXPECTED_PRIORITY_WISE_ROWS,
  alarmsEventsPriorityWiseData,
} from "./alarms-events-priority-wise.data";

export { EXPECTED_CHART_PERIODS };

export const alarmsEventsPriorityChartData = {
  path: "/indore/alarms-events/priority-wise/chart",
  date: alarmsEventsPriorityWiseData.date,
  maxResponseTime: 120_000,
};

export const EXPECTED_PRIORITY_CHART_PERIOD_COLUMNS = [
  "period",
  "fromDate",
  "toDate",
  "totalCount",
  "labels",
  "datasets",
] as const;

export const EXPECTED_PRIORITY_CHART_DATASET_COLUMNS = ["label", "data", "meterCount"] as const;

export const EXPECTED_PRIORITY_CHART_SERIES = ["1 PH", "3PH 4CT", "3PH WC", "HT"] as const;

export type AlarmsEventsPriorityChartTestCase = {
  testName: string;
  params: Record<string, string | number>;
  expectedStatus: 200 | 400;
  expectedPriority?: string;
  expectedLabel?: string;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@alarms-events", "@alarms-events-priority-chart", "@edge"];
const smoke = ["@smoke", "@alarms-events", "@alarms-events-priority-chart"];

function happyCases(): AlarmsEventsPriorityChartTestCase[] {
  return EXPECTED_PRIORITY_WISE_ROWS.filter((row) => row.priorityId !== 0).map((row) => ({
    testName: `GET /alarms-events/priority-wise/chart - ${row.label} for ${alarmsEventsPriorityChartData.date}`,
    params: {
      priority: row.label,
      date: alarmsEventsPriorityChartData.date,
    },
    expectedStatus: 200,
    expectedPriority: row.label,
    expectedLabel: row.label,
    tags: row.priorityId === 1 ? [...smoke] : [...tags],
  }));
}

export const alarmsEventsPriorityChartTestCases: AlarmsEventsPriorityChartTestCase[] = [
  ...happyCases(),
  {
    testName: `GET /alarms-events/priority-wise/chart - Active for ${alarmsEventsPriorityChartData.date}`,
    params: {
      priority: "Active",
      date: alarmsEventsPriorityChartData.date,
    },
    expectedStatus: 200,
    expectedPriority: "Active",
    expectedLabel: "Active",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - extra unused query is ignored",
    params: {
      priority: "Priority 1",
      date: alarmsEventsPriorityChartData.date,
      foo: "1",
    },
    expectedStatus: 200,
    expectedPriority: "Priority 1",
    expectedLabel: "Priority 1",
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - missing priority is rejected",
    params: { date: alarmsEventsPriorityChartData.date },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - missing date is rejected",
    params: { priority: "Priority 1" },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - blank priority is rejected",
    params: { priority: " ", date: alarmsEventsPriorityChartData.date },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - unknown priority is rejected",
    params: {
      priority: "Priority 99",
      date: alarmsEventsPriorityChartData.date,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - Priority 0 is rejected",
    params: {
      priority: "Priority 0",
      date: alarmsEventsPriorityChartData.date,
    },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - invalid date is rejected",
    params: { priority: "Priority 1", date: "23-08-2025" },
    expectedStatus: 400,
    tags: [...tags],
    nonEmptyExpected: false,
  },
  {
    testName: "GET /alarms-events/priority-wise/chart - a future date returns empty totals",
    params: { priority: "Priority 1", date: "2099-01-01" },
    expectedStatus: 200,
    expectedPriority: "Priority 1",
    expectedLabel: "Priority 1",
    tags: [...tags],
    nonEmptyExpected: false,
  },
];
