import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { AssetManagementCommonValidator } from "../Validator/asset-management-common.validator";
import {
  AssetManagementNegativeData,
  assetManagementPaths,
  DtrDetailPaginationQueries,
} from "../Data/asset-management.common.data";

test.describe("Asset Management — Negative", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "GET /asset-management/dtr/:id — unknown DTR returns 404",
    { tag: ["@negative", "@asset-management", "@dtr"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
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
      const validation = new ValidationEngine();
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
      const validation = new ValidationEngine();
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
      const validation = new ValidationEngine();
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

  test(
    "GET /asset-management/organisation-hierarchy — unknown rootId returns 404 or empty scoped tree",
    { tag: ["@negative", "@asset-management", "@hierarchy"] },
    async ({ authenticatedApi }) => {
      const validation = new ValidationEngine();
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
});

authTest.describe("Asset Management — Auth Negative", () => {
  authTest(
    "GET /asset-management/network-hierarchy — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.networkHierarchy,
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

      validation.printSummary("Network Hierarchy — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/organisation-hierarchy — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.organisationHierarchy,
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

      validation.printSummary("Organisation Hierarchy — Unauthorized", 0);
    },
  );

  authTest(
    "GET /asset-management/dtr/:id — without auth returns 401",
    { tag: ["@negative", "@asset-management", "@auth"] },
    async ({ unauthenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const { page, limit } = DtrDetailPaginationQueries.default;

      const rawResponse = await unauthenticatedApi.get(
        assetManagementPaths.dtrDetail(
          AssetManagementNegativeData.unknownDtrId,
          page,
          limit,
        ),
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
});
