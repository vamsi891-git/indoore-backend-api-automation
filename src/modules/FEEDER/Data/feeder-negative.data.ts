export type FeederNegativeCase = {
  testName: string;
  tags: string[];
  kind: "profile" | "alerts" | "electrical" | "daily-consumption";
  feederCode?: string;
  params?: Record<string, string | number | boolean>;
  expectedStatuses: number[];
  expectedCodes?: string[]; /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

export const feederNegativeCases: FeederNegativeCase[] = [
  {
    testName: "Feeder profile — a feeder that does not exist is not shown",
    tags: ["@feeder", "@profile", "@negative"],
    nonEmptyExpected: false,
    kind: "profile",
    feederCode: "INVALID_FEEDER_XYZ",
    expectedStatuses: [404],
    expectedCodes: ["FEEDER_NOT_FOUND", "NOT_FOUND"],
  },
  {
    testName: "Feeder alerts — page zero is not allowed",
    tags: ["@feeder", "@feeder-alerts", "@negative"],
    nonEmptyExpected: false,
    kind: "alerts",
    params: { page: 0, limit: 20 },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Feeder alerts — showing zero events at a time is not allowed",
    tags: ["@feeder", "@feeder-alerts", "@negative"],
    nonEmptyExpected: false,
    kind: "alerts",
    params: { page: 1, limit: 0 },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
  {
    testName: "Feeder daily energy — an unknown time grouping is not allowed",
    tags: ["@feeder", "@daily-consumption", "@negative"],
    nonEmptyExpected: false,
    kind: "daily-consumption",
    params: { granularity: "hourly" },
    expectedStatuses: [400, 422],
    expectedCodes: ["VALIDATION_ERROR"],
  },
];
