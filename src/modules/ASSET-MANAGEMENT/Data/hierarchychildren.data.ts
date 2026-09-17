export type HierarchyExplorerMode = "network" | "organisation";

export const HierarchyChildrenPaginationQueries = {
  default: { page: 1, pageSize: 20 },
  page2: { page: 2, pageSize: 20 },
  beyondTotal: { page: 999_999, pageSize: 20 },
} as const;

export const EXPECTED_HIERARCHY_CHILDREN_COLUMNS = [
  "id",
  "type",
  "code",
  "name",
  "displayName",
  "parentId",
  "hasChildren",
  "childCount",
  "consumerCount",
  "meterCount",
  "status",
  "isDtr",
] as const;

export function hierarchyChildrenQuery(params: {
  mode: HierarchyExplorerMode;
  page?: number;
  pageSize?: number;
  parentId?: number;
}): string {
  const page = params.page ?? HierarchyChildrenPaginationQueries.default.page;
  const pageSize =
    params.pageSize ?? HierarchyChildrenPaginationQueries.default.pageSize;
  const parts = [
    `mode=${params.mode}`,
    `page=${page}`,
    `pageSize=${pageSize}`,
  ];
  if (params.parentId != null) {
    parts.push(`parentId=${params.parentId}`);
  }
  return parts.join("&");
}

export const HierarchyChildrenInvalidQueries = [
  {
    testName: "GET /asset-management/hierarchy/children — missing mode",
    query: "page=1&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/children — mode=foo",
    query: "mode=foo&page=1&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/children — page=0",
    query: "mode=network&page=0&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/children — pageSize=0",
    query: "mode=network&page=1&pageSize=0",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/children — parentId=abc",
    query: "mode=network&page=1&pageSize=20&parentId=abc",
    expectedStatus: [400, 422] as const,
  },
] as const;
