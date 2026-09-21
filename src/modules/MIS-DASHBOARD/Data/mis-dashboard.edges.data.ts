export type MisDashboardErrorCode = "VALIDATION_ERROR" | "ROUTE_NOT_FOUND";

export type MisDashboardEdgeFamily = "priority-wise";

export type MisDashboardEdgeCase = {
  testName: string;
  family: MisDashboardEdgeFamily;
  params: Record<string, string>;
  priority?: string;
  expectedStatus: 200 | 400 | 404;
  expectedErrorCode?: MisDashboardErrorCode;
  tags: string[]; /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const edgeTags = ["@mis-dashboard", "@edge"];

export const misDashboardEdgeCases: MisDashboardEdgeCase[] = [
  {
    testName: "Urgency list — unknown urgency level is not found",
    family: "priority-wise",
    priority: "Priority99",
    params: { period: "daily" },
    expectedStatus: 404,
    expectedErrorCode: "ROUTE_NOT_FOUND",
    tags: edgeTags,
  },
  {
    testName: "Urgency list — a blank urgency level still shows the comparison",
    family: "priority-wise",
    priority: " ",
    params: { period: "daily" },
    expectedStatus: 200,
    tags: edgeTags,
  },
];
