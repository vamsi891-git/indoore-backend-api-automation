export const alarmsEventsPriorityWiseData = {
  path: "/indore/alarms-events/priority-wise",
  date: "2025-08-23",
  maxResponseTime: 120_000,
};

export const EXPECTED_PRIORITY_WISE_COLUMNS = [
  "priorityId",
  "label",
  "totalCount",
  "count",
  "previousCount",
] as const;

export const EXPECTED_PRIORITY_WISE_STATUS_COLUMNS = [
  "totalCount",
  "currentDay",
  "previousDay",
] as const;

export const EXPECTED_PRIORITY_WISE_ROWS = [
  { priorityId: 0, label: "Priority 0" },
  { priorityId: 1, label: "Priority 1" },
  { priorityId: 2, label: "Priority 2" },
  { priorityId: 3, label: "Priority 3" },
  { priorityId: 4, label: "Priority 4" },
  { priorityId: 5, label: "Priority 5" },
  { priorityId: 6, label: "Priority 6" },
] as const;

export type AlarmsEventsPriorityWiseTestCase = {
  testName: string;
  params?: Record<string, string | number>;
  expectedStatus: 200 | 400;
  expectedCurrentDate?: string;
  expectedPriorityIds?: readonly number[];
  tags: string[];
};

const tags = ["@alarms-events", "@alarms-events-priority-wise", "@edge"];
const smoke = ["@smoke", "@alarms-events", "@alarms-events-priority-wise"];

export const alarmsEventsPriorityWiseTestCases: AlarmsEventsPriorityWiseTestCase[] =
  [
    {
      testName: "GET /alarms-events/priority-wise - priority day compare loads",
      expectedStatus: 200,
      expectedPriorityIds: EXPECTED_PRIORITY_WISE_ROWS.map(
        (row) => row.priorityId,
      ),
      tags: smoke,
    },
    {
      testName: "GET /alarms-events/priority-wise - extra unused query is ignored",
      params: { foo: "1" },
      expectedStatus: 200,
      expectedPriorityIds: EXPECTED_PRIORITY_WISE_ROWS.map(
        (row) => row.priorityId,
      ),
      tags,
    },
    {
      testName: `GET /alarms-events/priority-wise - date ${alarmsEventsPriorityWiseData.date}`,
      params: { date: alarmsEventsPriorityWiseData.date },
      expectedStatus: 200,
      expectedCurrentDate: alarmsEventsPriorityWiseData.date,
      tags,
    },
    {
      testName: "GET /alarms-events/priority-wise - invalid date is rejected",
      params: { date: "23-08-2025" },
      expectedStatus: 400,
      tags,
    },
    {
      testName: "GET /alarms-events/priority-wise - blank date is rejected",
      params: { date: "" },
      expectedStatus: 400,
      tags,
    },
  ];
