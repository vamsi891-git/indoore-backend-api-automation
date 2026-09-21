import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { test } from "../../../fixtures/api.fixture";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { AssetManagementCommonValidator } from "../Validator/asset-management-common.validator";
import {
  AssetManagementNegativeData,
  assetManagementPaths,
  DtrDetailPaginationQueries,
} from "../Data/asset-management.common.data";
import { NetworkHierarchyInvalidQueries } from "../Data/networkhierarchy.data";
import { OrganisationHierarchyInvalidQueries } from "../Data/organisationhierarchy.data";
import { HierarchyChildrenInvalidQueries } from "../Data/hierarchychildren.data";
import { HierarchySearchInvalidQueries } from "../Data/hierarchysearch.data";
import { HierarchyTypesInvalidQueries } from "../Data/hierarchytypes.data";
import { AssetDetailInvalidPaths } from "../Data/assetdetail.data";
import { AssetExportInvalidQueries, assetExportQuery } from "../Data/assetexport.data";
import { mapMarkersQuery } from "../Data/mapmarkers.data";
import { AssetExportMapper } from "../Mapper/assetexport.mapper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Asset Management — Negative", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "GET /asset-management/dtr/:id — unknown DTR returns 404",
    { tag: ["@negative", "@asset-management", "@dtr"] },
    async ({ authenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const dtrId = AssetManagementNegativeData.unknownDtrId;
      const { page, limit } = DtrDetailPaginationQueries.default;

      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.dtrDetail(dtrId, page, limit),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [404],
        ),
      );

      validation.printSummary("DTR Detail — Not Found", 0);
    },
  );

  test(
    "GET /asset-management/dtr/:id — invalid id zero returns 400 or 404",
    { tag: ["@negative", "@asset-management", "@dtr"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const dtrId = AssetManagementNegativeData.invalidDtrId;
      const { page, limit } = DtrDetailPaginationQueries.default;

      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.dtrDetail(dtrId, page, limit),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (client error)", () => {
        expect([400, 404]).toContain(rawResponse.status());
      });
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [400, 404],
        ),
      );

      validation.printSummary("DTR Detail — Invalid ID", 0);
    },
  );

  test(
    "GET /asset-management/dtr/:id — invalid pagination params",
    { tag: ["@negative", "@asset-management", "@dtr"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const dtrId = AssetManagementNegativeData.unknownDtrId;

      for (const query of ["page=0&limit=20", "page=1&limit=0", "page=-1&limit=20"]) {
        const params = new URLSearchParams(query);
        const page = Number(params.get("page"));
        const limit = Number(params.get("limit"));
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          assetManagementPaths.dtrDetail(dtrId, page, limit),
        );
        const responseBody = await rawResponse.json().catch(() => ({}));

        validation.execute(`Status (${query})`, () => {
          expect([400, 404, 422]).toContain(rawResponse.status());
        });
        validation.execute(`Error envelope (${query})`, () =>
          AssetManagementCommonValidator.validateErrorResponse(
            rawResponse.status(),
            responseBody,
            [400, 404, 422],
          ),
        );
      }

      validation.printSummary("DTR Detail — Invalid Pagination", 0);
    },
  );

  test(
    "GET /asset-management/network-hierarchy — unknown rootId returns 404 or empty scoped tree",
    { tag: ["@negative", "@asset-management", "@hierarchy"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const rootId = AssetManagementNegativeData.unknownNetworkLookupId;

      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        `${assetManagementPaths.networkHierarchy}?rootId=${rootId}`,
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status", () => {
        expect([200, 404]).toContain(rawResponse.status());
      });

      if (rawResponse.status() === 200) {
        validation.execute("Empty hierarchy for unknown root", () => {
          expect(responseBody.success).toBe(true);
          expect(responseBody.data?.hierarchy ?? []).toEqual([]);
        });
      } else {
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(
            rawResponse.status(),
            responseBody,
            [404],
          ),
        );
      }

      validation.printSummary("Network Hierarchy — Unknown Root", 0);
    },
  );

  for (const row of NetworkHierarchyInvalidQueries) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@asset-management", "@hierarchy"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          `${assetManagementPaths.networkHierarchy}?${row.query}`,
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });

        if (status === 200) {
          validation.execute("Success envelope", () => {
            expect(responseBody.success).toBe(true);
            expect(Array.isArray(responseBody.data?.hierarchy)).toBe(true);
          });
        } else {
          validation.execute("Error envelope", () =>
            AssetManagementCommonValidator.validateErrorResponse(status, responseBody, [
              ...row.expectedStatus,
            ]),
          );
        }

        validation.printSummary(row.testName, 0);
      },
    );
  }

  test(
    "GET /asset-management/organisation-hierarchy — unknown rootId returns 404 or empty scoped tree",
    { tag: ["@negative", "@asset-management", "@hierarchy"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const rootId = AssetManagementNegativeData.unknownOrganisationLookupId;

      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        `${assetManagementPaths.organisationHierarchy}?rootId=${rootId}`,
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status", () => {
        expect([200, 404]).toContain(rawResponse.status());
      });

      if (rawResponse.status() === 200) {
        validation.execute("Empty hierarchy for unknown root", () => {
          expect(responseBody.success).toBe(true);
          expect(responseBody.data?.hierarchy ?? []).toEqual([]);
        });
      } else {
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(
            rawResponse.status(),
            responseBody,
            [404],
          ),
        );
      }

      validation.printSummary("Organisation Hierarchy — Unknown Root", 0);
    },
  );

  for (const row of OrganisationHierarchyInvalidQueries) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@asset-management", "@hierarchy"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          `${assetManagementPaths.organisationHierarchy}?${row.query}`,
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });

        if (status === 200) {
          validation.execute("Success envelope", () => {
            expect(responseBody.success).toBe(true);
            expect(Array.isArray(responseBody.data?.hierarchy)).toBe(true);
          });
        } else {
          validation.execute("Error envelope", () =>
            AssetManagementCommonValidator.validateErrorResponse(status, responseBody, [
              ...row.expectedStatus,
            ]),
          );
        }

        validation.printSummary(row.testName, 0);
      },
    );
  }

  test(
    "GET /asset-management/hierarchy/children — unknown parentId returns empty page",
    { tag: ["@negative", "@asset-management", "@hierarchy"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const parentId = AssetManagementNegativeData.unknownNetworkLookupId;
      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.hierarchyChildren(
          `mode=network&page=1&pageSize=20&parentId=${parentId}`,
        ),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status", () => {
        expect([200, 404]).toContain(rawResponse.status());
      });

      if (rawResponse.status() === 200) {
        validation.execute("Empty items for unknown parent", () => {
          expect(responseBody.success).toBe(true);
          expect(responseBody.data?.items ?? []).toEqual([]);
        });
      } else {
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(
            rawResponse.status(),
            responseBody,
            [404],
          ),
        );
      }

      validation.printSummary("Hierarchy Children — Unknown Parent", 0);
    },
  );

  for (const row of HierarchyChildrenInvalidQueries) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@asset-management", "@hierarchy"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          assetManagementPaths.hierarchyChildren(row.query),
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(status, responseBody, [
            ...row.expectedStatus,
          ]),
        );

        validation.printSummary(row.testName, 0);
      },
    );
  }

  test(
    "GET /asset-management/hierarchy/search — unknown hierarchyId returns empty page",
    { tag: ["@negative", "@asset-management", "@hierarchy"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const hierarchyId = AssetManagementNegativeData.unknownNetworkLookupId;
      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.hierarchySearch(
          `mode=network&q=11&page=1&pageSize=20&hierarchyId=${hierarchyId}`,
        ),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status", () => {
        expect([200, 404]).toContain(rawResponse.status());
      });

      if (rawResponse.status() === 200) {
        validation.execute("Empty items for unknown hierarchyId", () => {
          expect(responseBody.success).toBe(true);
          expect(responseBody.data?.items ?? []).toEqual([]);
        });
      } else {
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(
            rawResponse.status(),
            responseBody,
            [404],
          ),
        );
      }

      validation.printSummary("Hierarchy Search — Unknown hierarchyId", 0);
    },
  );

  for (const row of HierarchySearchInvalidQueries) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@asset-management", "@hierarchy"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          assetManagementPaths.hierarchySearch(row.query),
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(status, responseBody, [
            ...row.expectedStatus,
          ]),
        );

        validation.printSummary(row.testName, 0);
      },
    );
  }

  for (const row of HierarchyTypesInvalidQueries) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@asset-management", "@hierarchy"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const path =
          row.query.length > 0
            ? assetManagementPaths.hierarchyTypes(row.query)
            : "/indore/asset-management/hierarchy/types";
        const rawResponse = await getWithAutoRefresh(authenticatedApi, path);
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(status, responseBody, [
            ...row.expectedStatus,
          ]),
        );

        validation.printSummary(row.testName, 0);
      },
    );
  }

  test(
    "GET /asset-management/assets/network/:id — unknown id returns 404",
    { tag: ["@negative", "@asset-management", "@asset-detail"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.assetDetail(
          "network",
          AssetManagementNegativeData.unknownNetworkLookupId,
        ),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status", () => {
        expect(rawResponse.status()).toEqual(404);
      });
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [404],
        ),
      );
      validation.printSummary("Asset Detail — Unknown Network", 0);
    },
  );

  test(
    "GET /asset-management/assets/organisation/:id — unknown id returns 404",
    { tag: ["@negative", "@asset-management", "@asset-detail"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.assetDetail(
          "organisation",
          AssetManagementNegativeData.unknownOrganisationLookupId,
        ),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status", () => {
        expect(rawResponse.status()).toEqual(404);
      });
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [404],
        ),
      );
      validation.printSummary("Asset Detail — Unknown Organisation", 0);
    },
  );

  test(
    "GET /asset-management/assets/dtr/:id — unknown id returns 404",
    { tag: ["@negative", "@asset-management", "@asset-detail"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.assetDetail("dtr", AssetManagementNegativeData.unknownDtrId),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status", () => {
        expect(rawResponse.status()).toEqual(404);
      });
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [404],
        ),
      );
      validation.printSummary("Asset Detail — Unknown DTR", 0);
    },
  );

  for (const row of AssetDetailInvalidPaths) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@asset-management", "@asset-detail"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(authenticatedApi, row.path);
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();
        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(status, responseBody, [
            ...row.expectedStatus,
          ]),
        );
        validation.printSummary(row.testName, 0);
      },
    );
  }

  test(
    "GET /asset-management/export — unknown hierarchyId returns empty CSV or 404",
    { tag: ["@negative", "@asset-management", "@asset-export"] },
    async ({ authenticatedApi }) => {
      const validation = new ApiValidationHelper();
      const rawResponse = await getWithAutoRefresh(
        authenticatedApi,
        assetManagementPaths.export(
          assetExportQuery({
            kind: "network",
            hierarchyId: AssetManagementNegativeData.unknownNetworkLookupId,
          }),
        ),
        { headers: { Accept: "text/csv" } },
      );
      const status = rawResponse.status();
      const contentType = rawResponse.headers()["content-type"] ?? "";

      validation.execute("Status", () => {
        expect([200, 400, 404, 422]).toContain(status);
      });

      if (status === 200 && contentType.includes("text/csv")) {
        const csvContent = await rawResponse.text();
        const data = AssetExportMapper.mapCsv(csvContent);
        validation.execute("Empty rows for unknown hierarchyId", () => {
          expect(data.items).toEqual([]);
        });
      } else {
        const responseBody = await rawResponse.json().catch(() => ({}));
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(
            status,
            responseBody,
            [400, 404, 422],
          ),
        );
      }

      validation.printSummary("Asset Export — Unknown hierarchyId", 0);
    },
  );

  for (const row of AssetExportInvalidQueries) {
    test(
      `${row.testName} (negative)`,
      { tag: ["@negative", "@asset-management", "@asset-export"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          assetManagementPaths.export(row.query),
          { headers: { Accept: "text/csv" } },
        );
        const responseBody = await rawResponse.json().catch(() => ({}));
        const status = rawResponse.status();

        validation.execute("Status", () => {
          expect(row.expectedStatus).toContain(status);
        });
        validation.execute("Error envelope", () =>
          AssetManagementCommonValidator.validateErrorResponse(status, responseBody, [
            ...row.expectedStatus,
          ]),
        );

        validation.printSummary(row.testName, 0);
      },
    );
  }
});

authTest.describe("Asset Management — Auth Negative", () => {
  authTest(
    "GET /asset-management/network-hierarchy — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      const rawResponse = await unauthenticatedApi.get(assetManagementPaths.networkHierarchy);
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );

      validation.printSummary("Network Hierarchy — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/organisation-hierarchy — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      const rawResponse = await unauthenticatedApi.get(assetManagementPaths.organisationHierarchy);
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );

      validation.printSummary("Organisation Hierarchy — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/dtr/:id — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const { page, limit } = DtrDetailPaginationQueries.default;

      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.dtrDetail(AssetManagementNegativeData.unknownDtrId, page, limit),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );

      validation.printSummary("DTR Detail — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/hierarchy/children — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.hierarchyChildren("mode=network&page=1&pageSize=20"),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );

      validation.printSummary("Hierarchy Children — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/hierarchy/search — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.hierarchySearch("mode=organisation&q=In&page=1&pageSize=20"),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );

      validation.printSummary("Hierarchy Search — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/hierarchy/types — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.hierarchyTypes("mode=network"),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));

      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );

      validation.printSummary("Hierarchy Types — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/assets/network/:id — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.assetDetail("network", 1),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );
      validation.printSummary("Asset Detail Network — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/assets/organisation/:id — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.assetDetail("organisation", 1),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );
      validation.printSummary("Asset Detail Organisation — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/assets/dtr/:id — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const rawResponse = await unauthenticatedApi.get(assetManagementPaths.assetDetail("dtr", 1));
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );
      validation.printSummary("Asset Detail DTR — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/export — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth", "@asset-export"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.export(assetExportQuery({ kind: "network" })),
        { headers: { Accept: "text/csv" } },
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );
      validation.printSummary("Asset Export — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/map-markers — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth", "@map-markers"] },
    async ({ unauthenticatedApi }) => {
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.mapMarkers(mapMarkersQuery({ mode: "network", limit: 2000 })),
      );
      const responseBody = await rawResponse.json().catch(() => ({}));
      validation.execute("Status (unauthorized)", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.execute("Error envelope", () =>
        AssetManagementCommonValidator.validateErrorResponse(
          rawResponse.status(),
          responseBody,
          [401],
        ),
      );
      validation.printSummary("Map Markers — Unauthorized", 0);
    },
  );
});
