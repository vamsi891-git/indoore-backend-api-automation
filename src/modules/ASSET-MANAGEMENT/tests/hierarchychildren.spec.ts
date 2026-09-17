import { test } from "../../../../src/fixtures/api.fixture";
import { HierarchyChildrenApi } from "../Api/hierarchychildren.api";
import {
  HierarchyChildrenPaginationQueries,
  hierarchyChildrenQuery,
} from "../Data/hierarchychildren.data";
import type { HierarchyChildrenData } from "../Mapper/hierarchychildren.mapper";
import { runHierarchyChildrenValidation } from "./hierarchychildren.harness";

test.describe("Hierarchy Children API", () => {
  test.describe.configure({ mode: "serial" });

  let networkRoots: HierarchyChildrenData | null = null;

  test(
    "GET /asset-management/hierarchy/children — network roots",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchyChildrenPaginationQueries.default;
      const query = hierarchyChildrenQuery({
        mode: "network",
        page,
        pageSize,
      });
      const result = await runHierarchyChildrenValidation({
        api: new HierarchyChildrenApi(authenticatedApi),
        query,
        mode: "network",
        page,
        pageSize,
        testLabel: "Hierarchy Children — Network roots",
      });
      networkRoots = result.data;
    },
  );

  test(
    "GET /asset-management/hierarchy/children — organisation roots",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchyChildrenPaginationQueries.default;
      const query = hierarchyChildrenQuery({
        mode: "organisation",
        page,
        pageSize,
      });
      await runHierarchyChildrenValidation({
        api: new HierarchyChildrenApi(authenticatedApi),
        query,
        mode: "organisation",
        page,
        pageSize,
        testLabel: "Hierarchy Children — Organisation roots",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/children — network parentId children",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const parent = networkRoots?.items.find((item) => item.hasChildren);
      if (parent == null) {
        test.skip(true, "No network root with children on page 1");
        return;
      }

      const { page, pageSize } = HierarchyChildrenPaginationQueries.default;
      const query = hierarchyChildrenQuery({
        mode: "network",
        page,
        pageSize,
        parentId: parent.id,
      });
      await runHierarchyChildrenValidation({
        api: new HierarchyChildrenApi(authenticatedApi),
        query,
        mode: "network",
        page,
        pageSize,
        parentId: parent.id,
        testLabel: "Hierarchy Children — Network parentId",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/children — network page 2",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      if (networkRoots == null || networkRoots.totalPages < 2) {
        test.skip(true, "Network roots have fewer than 2 pages");
        return;
      }

      const { page, pageSize } = HierarchyChildrenPaginationQueries.page2;
      const query = hierarchyChildrenQuery({
        mode: "network",
        page,
        pageSize,
      });
      await runHierarchyChildrenValidation({
        api: new HierarchyChildrenApi(authenticatedApi),
        query,
        mode: "network",
        page,
        pageSize,
        testLabel: "Hierarchy Children — Network page 2",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/children — network beyond total",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchyChildrenPaginationQueries.beyondTotal;
      const query = hierarchyChildrenQuery({
        mode: "network",
        page,
        pageSize,
      });
      await runHierarchyChildrenValidation({
        api: new HierarchyChildrenApi(authenticatedApi),
        query,
        mode: "network",
        page,
        pageSize,
        requireItems: false,
        testLabel: "Hierarchy Children — Network beyond total",
      });
    },
  );
});
