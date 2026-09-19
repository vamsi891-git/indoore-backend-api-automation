export const alarmsEventsCategoryWiseData = {
  path: "/indore/alarms-events/category-wise",
  date: "2025-08-23",
  maxResponseTime: 120_000,
};

export const EXPECTED_CATEGORY_WISE_COLUMNS = [
  "category",
  "label",
  "totalCount",
  "count",
  "previousCount",
] as const;

export const EXPECTED_CATEGORY_WISE_ROWS = [
  { slug: "voltage", label: "Voltage" },
  { slug: "current", label: "Current" },
  { slug: "power", label: "Power" },
  { slug: "transaction", label: "Transaction" },
  { slug: "other", label: "Others" },
  { slug: "non-rollover-control", label: "NonRollover" },
] as const;

export type AlarmsEventsCategoryWiseTestCase = {
  testName: string;
  params?: Record<string, string | number>;
  expectedStatus: 200 | 400;
  expectedCurrentDate?: string;
  tags: string[];
};

const tags = ["@alarms-events", "@alarms-events-category-wise", "@edge"];
const smoke = ["@smoke", "@alarms-events", "@alarms-events-category-wise"];

export const alarmsEventsCategoryWiseTestCases: AlarmsEventsCategoryWiseTestCase[] =
  [
    {
      testName: "GET /alarms-events/category-wise - classification day compare loads",
      expectedStatus: 200,
      tags: smoke,
    },
    {
      testName: "GET /alarms-events/category-wise - extra unused query is ignored",
      params: { foo: "1" },
      expectedStatus: 200,
      tags,
    },
    {
      testName: `GET /alarms-events/category-wise - date ${alarmsEventsCategoryWiseData.date}`,
      params: { date: alarmsEventsCategoryWiseData.date },
      expectedStatus: 200,
      expectedCurrentDate: alarmsEventsCategoryWiseData.date,
      tags,
    },
    {
      testName: "GET /alarms-events/category-wise - invalid date is rejected",
      params: { date: "23-08-2025" },
      expectedStatus: 400,
      tags,
    },
  ];
