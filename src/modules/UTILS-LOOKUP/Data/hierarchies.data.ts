import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type HierarchyScenario = "smoke" | "edge_order_sequence";

export interface HierarchyTestCase extends LookupTestCase {
  scenario: HierarchyScenario;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const organizationHierarchyTestCases: HierarchyTestCase[] = [
  {
    testName: "Organisation hierarchy — live tree",
    scenario: "smoke",
    tags: ["@smoke", "@utils-lookup", "@organisation-hierarchy"],
    nonEmptyExpected: true,
  },
  {
    testName: "Organisation hierarchy — order is 1 through n",
    scenario: "edge_order_sequence",
    tags: ["@utils-lookup", "@organisation-hierarchy", "@edge"],
    nonEmptyExpected: false,
  },
];

export const networkHierarchyTestCases: HierarchyTestCase[] = [
  {
    testName: "Network hierarchy — live tree",
    scenario: "smoke",
    tags: ["@smoke", "@utils-lookup", "@network-hierarchy"],
    nonEmptyExpected: true,
  },
  {
    testName: "Network hierarchy — order is 1 through n",
    scenario: "edge_order_sequence",
    tags: ["@utils-lookup", "@network-hierarchy", "@edge"],
    nonEmptyExpected: false,
  },
];
