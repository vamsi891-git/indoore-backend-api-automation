export const eventPriorityOverviewQuery = {
  assetType: "all",
};

export type EventPriorityOverviewTestCase = {
  testName: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@mis-dashboard", "@event-data", "@edge"];
const smoke = ["@smoke", "@event-data", "@mis-dashboard"];
const title = "Urgency today versus yesterday";

export const eventPriorityOverviewTestCases: EventPriorityOverviewTestCase[] = [
  {
    testName: `${title} — all meters`,
    params: { assetType: "all" },
    expectedStatus: 200,
    tags: smoke,
  },
  {
    testName: `${title} — consumer meters only`,
    params: { assetType: "consumer" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: `${title} — DTR meters only`,
    params: { assetType: "dtr" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: `${title} — both is treated as all meters`,
    params: { assetType: "both" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: `${title} — consumers is treated as consumer meters`,
    params: { assetType: "consumers" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: `${title} — dtrs is treated as DTR meters`,
    params: { assetType: "dtrs" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: `${title} — no meter kind still opens`,
    params: {},
    expectedStatus: 200,
    tags,
  },
  {
    testName: `${title} — extra unused options are ignored`,
    params: { assetType: "all", foo: "1" },
    expectedStatus: 200,
    tags,
  },
  {
    testName: `${title} — organisation 0 is rejected`,
    params: { assetType: "all", organisationLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: `${title} — network 0 is rejected`,
    params: { assetType: "all", networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
