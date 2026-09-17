import type { HierarchyExplorerMode } from "./hierarchychildren.data";

export const DEFAULT_MAP_MARKERS_LIMIT = 2000;

export const EXPECTED_MAP_MARKER_COLUMNS = [
  "id",
  "kind",
  "assetId",
  "nodeId",
  "name",
  "code",
  "lat",
  "lng",
] as const;

export const EXPECTED_MAP_MARKERS_DATA_COLUMNS = [
  "markers",
  "count",
  "limit",
  "truncated",
  "consumerTotal",
  "dtrTotal",
  "consumerMappedTotal",
  "dtrMappedTotal",
  "onlineCount",
  "offlineCount",
] as const;

export const EXPECTED_MAP_MARKER_KINDS = ["consumer", "dtr"] as const;

export function mapMarkersQuery(params: {
  mode?: HierarchyExplorerMode;
  limit?: number;
  hierarchyId?: number;
}): string {
  const parts: string[] = [];
  if (params.mode != null) {
    parts.push(`mode=${params.mode}`);
  }
  if (params.limit != null) {
    parts.push(`limit=${params.limit}`);
  }
  if (params.hierarchyId != null) {
    parts.push(`hierarchyId=${params.hierarchyId}`);
  }
  return parts.join("&");
}

export const MapMarkersInvalidQueries = [
  {
    testName: "GET /asset-management/map-markers — mode=foo",
    query: "mode=foo&limit=2000",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/map-markers — mode=organization",
    query: "mode=organization&limit=2000",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/map-markers — limit=0",
    query: "mode=network&limit=0",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/map-markers — limit=abc",
    query: "mode=network&limit=abc",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/map-markers — hierarchyId=abc",
    query: "mode=network&limit=50&hierarchyId=abc",
    expectedStatus: [400, 422] as const,
  },
] as const;
