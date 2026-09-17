/** Invalid `rootId` queries for GET /asset-management/network-hierarchy. */
export const NetworkHierarchyInvalidQueries = [
  {
    testName: "GET /asset-management/network-hierarchy — rootId=0",
    query: "rootId=0",
    expectedStatus: [200, 400, 404] as const,
  },
  {
    testName: "GET /asset-management/network-hierarchy — non-numeric rootId",
    query: "rootId=abc",
    expectedStatus: [400, 422] as const,
  },
] as const;
