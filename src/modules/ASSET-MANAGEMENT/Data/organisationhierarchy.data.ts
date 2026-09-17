/** Invalid `rootId` queries for GET /asset-management/organisation-hierarchy. */
export const OrganisationHierarchyInvalidQueries = [
  {
    testName: "GET /asset-management/organisation-hierarchy — rootId=0",
    query: "rootId=0",
    expectedStatus: [200, 400, 404] as const,
  },
  {
    testName: "GET /asset-management/organisation-hierarchy — non-numeric rootId",
    query: "rootId=abc",
    expectedStatus: [400, 422] as const,
  },
] as const;
