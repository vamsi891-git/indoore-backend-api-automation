import type { LookupTestCase } from "../utils/lookup-spec.harness";

export type HierarchyScenario = "smoke" | "edge_order_sequence";

export interface HierarchyTestCase extends LookupTestCase {
  scenario: HierarchyScenario;
}

export const organizationHierarchyTestCases: HierarchyTestCase[] = [
  {
    testName: "Validate organisation hierarchy — live tree",
    scenario: "smoke",
    tags: ["@smoke", "@utils-lookup", "@organisation-hierarchy"],
  },
  {
    testName: "Validate organisation hierarchy — order sequence 1..n",
    scenario: "edge_order_sequence",
    tags: ["@utils-lookup", "@organisation-hierarchy", "@edge"],
  },
];

export const networkHierarchyTestCases: HierarchyTestCase[] = [
  {
    testName: "Validate network hierarchy — live tree",
    scenario: "smoke",
    tags: ["@smoke", "@utils-lookup", "@network-hierarchy"],
  },
  {
    testName: "Validate network hierarchy — order sequence 1..n",
    scenario: "edge_order_sequence",
    tags: ["@utils-lookup", "@network-hierarchy", "@edge"],
  },
];
