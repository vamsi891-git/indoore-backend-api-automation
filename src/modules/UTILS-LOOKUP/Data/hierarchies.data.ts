import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type HierarchyScenario = "smoke" | "edge_order_sequence";

export interface HierarchyTestCase extends LookupTestCase {
  scenario: HierarchyScenario;
}

export const organizationHierarchyTestCases: HierarchyTestCase[] = [
  {
    testName: "Organisation hierarchy — live tree",
    scenario: "smoke",
    tags: ["@smoke", "@utils-lookup", "@organisation-hierarchy"],
  },
  {
    testName: "Organisation hierarchy — order is 1 through n",
    scenario: "edge_order_sequence",
    tags: ["@utils-lookup", "@organisation-hierarchy", "@edge"],
  },
];

export const networkHierarchyTestCases: HierarchyTestCase[] = [
  {
    testName: "Network hierarchy — live tree",
    scenario: "smoke",
    tags: ["@smoke", "@utils-lookup", "@network-hierarchy"],
  },
  {
    testName: "Network hierarchy — order is 1 through n",
    scenario: "edge_order_sequence",
    tags: ["@utils-lookup", "@network-hierarchy", "@edge"],
  },
];
