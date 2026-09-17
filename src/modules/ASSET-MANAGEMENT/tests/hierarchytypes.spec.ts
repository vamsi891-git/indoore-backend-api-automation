import { test } from "../../../../src/fixtures/api.fixture";
import { HierarchyTypesApi } from "../Api/hierarchytypes.api";
import { hierarchyTypesQuery } from "../Data/hierarchytypes.data";
import { runHierarchyTypesValidation } from "./hierarchytypes.harness";

test.describe("Hierarchy Types API", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "GET /asset-management/hierarchy/types — network",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      await runHierarchyTypesValidation({
        api: new HierarchyTypesApi(authenticatedApi),
        query: hierarchyTypesQuery("network"),
        mode: "network",
        testLabel: "Hierarchy Types — Network",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/types — organisation",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      await runHierarchyTypesValidation({
        api: new HierarchyTypesApi(authenticatedApi),
        query: hierarchyTypesQuery("organisation"),
        mode: "organisation",
        testLabel: "Hierarchy Types — Organisation",
      });
    },
  );
});
