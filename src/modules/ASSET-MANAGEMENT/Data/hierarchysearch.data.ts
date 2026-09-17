import type { HierarchyExplorerMode } from "./hierarchychildren.data";

export const HierarchySearchPaginationQueries = {
  default: { page: 1, pageSize: 20 },
  page2: { page: 2, pageSize: 20 },
  smallPage: { page: 1, pageSize: 10 },
  beyondTotal: { page: 999_999, pageSize: 20 },
} as const;

/** Override via HIERARCHY_SEARCH_ORG_Q / HIERARCHY_SEARCH_NETWORK_Q */
export const HierarchySearchQueries = {
  organisation: {
    mode: "organisation" as const,
    q: process.env.HIERARCHY_SEARCH_ORG_Q?.trim() || "In",
  },
  network: {
    mode: "network" as const,
    q: process.env.HIERARCHY_SEARCH_NETWORK_Q?.trim() || "11",
  },
  noMatch: "__no_hierarchy_hit_xyz__",
} as const;

export const EXPECTED_HIERARCHY_SEARCH_COLUMNS = ["node", "ancestors"] as const;

export const EXPECTED_HIERARCHY_SEARCH_ANCESTOR_COLUMNS = [
  "id",
  "type",
  "code",
  "name",
] as const;

export function hierarchySearchQuery(params: {
  mode: HierarchyExplorerMode;
  q: string;
  page?: number;
  pageSize?: number;
  hierarchyId?: number;
}): string {
  const page = params.page ?? HierarchySearchPaginationQueries.default.page;
  const pageSize =
    params.pageSize ?? HierarchySearchPaginationQueries.default.pageSize;
  const parts = [
    `mode=${params.mode}`,
    `q=${encodeURIComponent(params.q)}`,
    `page=${page}`,
    `pageSize=${pageSize}`,
  ];
  if (params.hierarchyId != null) {
    parts.push(`hierarchyId=${params.hierarchyId}`);
  }
  return parts.join("&");
}

export const HierarchySearchInvalidQueries = [
  {
    testName: "GET /asset-management/hierarchy/search — missing mode",
    query: "q=In&page=1&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/search — missing q",
    query: "mode=organisation&page=1&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/search — empty q",
    query: "mode=organisation&q=&page=1&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/search — mode=foo",
    query: "mode=foo&q=In&page=1&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/search — page=0",
    query: "mode=network&q=11&page=0&pageSize=20",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/search — pageSize=0",
    query: "mode=network&q=11&page=1&pageSize=0",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/hierarchy/search — hierarchyId=abc",
    query: "mode=network&q=11&page=1&pageSize=20&hierarchyId=abc",
    expectedStatus: [400, 422] as const,
  },
] as const;
