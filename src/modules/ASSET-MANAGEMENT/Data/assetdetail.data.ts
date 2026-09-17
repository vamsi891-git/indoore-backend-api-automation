export type AssetExplorerKind = "network" | "organisation" | "dtr";

export const EXPECTED_ASSET_DETAIL_COLUMNS = [
  "id",
  "kind",
  "type",
  "code",
  "name",
  "displayName",
  "status",
  "hierarchyPath",
  "hierarchySummary",
  "consumerCount",
  "dtrCount",
  "meterCount",
  "activeMeterCount",
  "inactiveMeterCount",
  "faultyMeterCount",
  "unknownMeterCount",
  "assetHealthPercentage",
  "assetHealthAvailable",
  "connectedSince",
  "lastUpdatedAt",
  "meterSummary",
  "communicationSummary",
  "recentActivity",
] as const;

export const EXPECTED_ASSET_HIERARCHY_PATH_COLUMNS = [
  "id",
  "type",
  "code",
  "name",
] as const;

export const EXPECTED_ASSET_HIERARCHY_SUMMARY_COLUMNS = [
  "type",
  "label",
  "relationship",
  "directCount",
  "descendantCount",
] as const;

export const EXPECTED_ASSET_METER_SUMMARY_COLUMNS = [
  "total",
  "active",
  "inactive",
  "faulty",
  "unknown",
  "available",
] as const;

export const EXPECTED_ASSET_COMMUNICATION_SUMMARY_COLUMNS = [
  "available",
  "consumerOnline",
  "dtrOnline",
  "totalOnline",
  "consumerOffline",
  "dtrOffline",
  "totalOffline",
] as const;

export const EXPECTED_ASSET_RECENT_ACTIVITY_COLUMNS = [
  "available",
  "items",
  "total",
] as const;

export const AssetDetailInvalidPaths = [
  {
    testName: "GET /asset-management/assets/:kind/:id — kind=foo",
    path: "/indore/asset-management/assets/foo/1",
    expectedStatus: [400, 404, 422] as const,
  },
  {
    testName: "GET /asset-management/assets/network/:id — non-numeric id",
    path: "/indore/asset-management/assets/network/abc",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /asset-management/assets/network/:id — id=0",
    path: "/indore/asset-management/assets/network/0",
    expectedStatus: [400, 404] as const,
  },
  {
    testName: "GET /asset-management/assets/organisation/:id — id=0",
    path: "/indore/asset-management/assets/organisation/0",
    expectedStatus: [400, 404] as const,
  },
  {
    testName: "GET /asset-management/assets/dtr/:id — id=0",
    path: "/indore/asset-management/assets/dtr/0",
    expectedStatus: [400, 404] as const,
  },
] as const;
