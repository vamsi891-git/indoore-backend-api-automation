import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { NetworkHierarchyInvalidQueries } from "../Data/networkhierarchy.data";
import { OrganisationHierarchyInvalidQueries } from "../Data/organisationhierarchy.data";
import { HierarchyChildrenInvalidQueries } from "../Data/hierarchychildren.data";
import { HierarchySearchInvalidQueries } from "../Data/hierarchysearch.data";
import { HierarchyTypesInvalidQueries } from "../Data/hierarchytypes.data";
import { AssetDetailInvalidPaths } from "../Data/assetdetail.data";
import { AssetExportInvalidQueries } from "../Data/assetexport.data";
import { MapMarkersInvalidQueries } from "../Data/mapmarkers.data";
import { assetManagementPaths } from "../Data/asset-management.common.data";
import { AssetManagementCommonValidator } from "../Validator/asset-management-common.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Asset Management — Edge", () => {
  test.describe.configure({ mode: "serial" });

  for (const row of NetworkHierarchyInvalidQueries) {
    test(
      row.testName,
      { tag: ["@edge", "@asset-management", "@hierarchy"] },
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
          validation.execute("Empty or scoped hierarchy", () => {
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

  for (const row of OrganisationHierarchyInvalidQueries) {
    test(
      row.testName,
      { tag: ["@edge", "@asset-management", "@hierarchy"] },
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
          validation.execute("Empty or scoped hierarchy", () => {
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

  for (const row of HierarchyChildrenInvalidQueries) {
    test(
      row.testName,
      { tag: ["@edge", "@asset-management", "@hierarchy"] },
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

  for (const row of HierarchySearchInvalidQueries) {
    test(
      row.testName,
      { tag: ["@edge", "@asset-management", "@hierarchy"] },
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
      row.testName,
      { tag: ["@edge", "@asset-management", "@hierarchy"] },
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

  for (const row of AssetDetailInvalidPaths) {
    test(
      row.testName,
      { tag: ["@edge", "@asset-management", "@asset-detail"] },
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

  for (const row of AssetExportInvalidQueries) {
    test(
      row.testName,
      { tag: ["@edge", "@asset-management", "@asset-export"] },
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

  for (const row of MapMarkersInvalidQueries) {
    test(
      row.testName,
      { tag: ["@edge", "@asset-management", "@map-markers"] },
      async ({ authenticatedApi }) => {
        const validation = new ApiValidationHelper();
        const rawResponse = await getWithAutoRefresh(
          authenticatedApi,
          assetManagementPaths.mapMarkers(row.query),
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
