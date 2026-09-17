import { test } from "../../../../src/fixtures/api.fixture";
import { HierarchySearchApi } from "../Api/hierarchysearch.api";
import {
  HierarchySearchPaginationQueries,
  HierarchySearchQueries,
  hierarchySearchQuery,
} from "../Data/hierarchysearch.data";
import type { HierarchySearchData } from "../Mapper/hierarchysearch.mapper";
import { runHierarchySearchValidation } from "./hierarchysearch.harness";

test.describe("Hierarchy Search API", () => {
  test.describe.configure({ mode: "serial" });

  let networkSearch: HierarchySearchData | null = null;

  test(
    "GET /asset-management/hierarchy/search — organisation q",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchySearchPaginationQueries.default;
      const { mode, q } = HierarchySearchQueries.organisation;
      await runHierarchySearchValidation({
        api: new HierarchySearchApi(authenticatedApi),
        query: hierarchySearchQuery({ mode, q, page, pageSize }),
        mode,
        q,
        page,
        pageSize,
        testLabel: "Hierarchy Search — Organisation",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/search — organisation pageSize=10",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchySearchPaginationQueries.smallPage;
      const { mode, q } = HierarchySearchQueries.organisation;
      await runHierarchySearchValidation({
        api: new HierarchySearchApi(authenticatedApi),
        query: hierarchySearchQuery({ mode, q, page, pageSize }),
        mode,
        q,
        page,
        pageSize,
        testLabel: "Hierarchy Search — Organisation pageSize 10",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/search — network q",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchySearchPaginationQueries.default;
      const { mode, q } = HierarchySearchQueries.network;
      const result = await runHierarchySearchValidation({
        api: new HierarchySearchApi(authenticatedApi),
        query: hierarchySearchQuery({ mode, q, page, pageSize }),
        mode,
        q,
        page,
        pageSize,
        testLabel: "Hierarchy Search — Network",
      });
      networkSearch = result.data;
    },
  );

  test(
    "GET /asset-management/hierarchy/search — network page 2",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      if (networkSearch == null || networkSearch.totalPages < 2) {
        test.skip(true, "Network search has fewer than 2 pages");
        return;
      }

      const { page, pageSize } = HierarchySearchPaginationQueries.page2;
      const { mode, q } = HierarchySearchQueries.network;
      await runHierarchySearchValidation({
        api: new HierarchySearchApi(authenticatedApi),
        query: hierarchySearchQuery({ mode, q, page, pageSize }),
        mode,
        q,
        page,
        pageSize,
        testLabel: "Hierarchy Search — Network page 2",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/search — network beyond total",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchySearchPaginationQueries.beyondTotal;
      const { mode, q } = HierarchySearchQueries.network;
      await runHierarchySearchValidation({
        api: new HierarchySearchApi(authenticatedApi),
        query: hierarchySearchQuery({ mode, q, page, pageSize }),
        mode,
        q,
        page,
        pageSize,
        requireItems: false,
        testLabel: "Hierarchy Search — Network beyond total",
      });
    },
  );

  test(
    "GET /asset-management/hierarchy/search — no match returns empty items",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const { page, pageSize } = HierarchySearchPaginationQueries.default;
      const q = HierarchySearchQueries.noMatch;
      await runHierarchySearchValidation({
        api: new HierarchySearchApi(authenticatedApi),
        query: hierarchySearchQuery({
          mode: "organisation",
          q,
          page,
          pageSize,
        }),
        mode: "organisation",
        q,
        page,
        pageSize,
        requireItems: false,
        checkMatch: false,
        testLabel: "Hierarchy Search — No match",
      });
    },
  );
});
