import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import type { OrganisationNode } from "../Mapper/organizationhierarchy.mapper";
import {
  findFirstEmptyOfficeCode,
  findFirstOfficeWithDtrs,
  findFirstOfficeWithEmptyDtrs,
} from "../utils/asset-management.helper";
import { runOrganisationHierarchyValidation } from "./organisation-hierarchy.harness";

test.describe("Organisation Hierarchy API", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS);

  let hierarchy: OrganisationNode[] = [];

  test(
    "Validate Organisation Hierarchy API",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const api = new OrganisationHierarchyApi(authenticatedApi);
      const result = await runOrganisationHierarchyValidation({
        api,
        testLabel: "Organisation Hierarchy API",
      });
      hierarchy = result.hierarchy;

      const emptyDtrsOffice = findFirstOfficeWithEmptyDtrs(hierarchy);
      if (emptyDtrsOffice) {
        expect(emptyDtrsOffice.dtrs).toEqual([]);
      }

      const emptyCode = findFirstEmptyOfficeCode(hierarchy);
      if (emptyCode) {
        expect(emptyCode.officeCode?.trim() ?? "").toEqual("");
      }
    },
  );

  test(
    "GET /asset-management/organisation-hierarchy — office subtree with DTRs",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const office = findFirstOfficeWithDtrs(hierarchy);
      if (office == null) {
        test.skip(true, "No office with catalog DTRs in the full organisation tree");
        return;
      }

      const api = new OrganisationHierarchyApi(authenticatedApi);
      await runOrganisationHierarchyValidation({
        api,
        rootId: office.organisationLookupId,
        includeSubtreeChecks: true,
        testLabel: "Organisation Hierarchy — Office subtree",
      });
    },
  );
});
