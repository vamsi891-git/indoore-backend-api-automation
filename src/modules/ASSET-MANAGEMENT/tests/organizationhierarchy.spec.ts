import { test } from "../../../../src/fixtures/api.fixture";
import { OrganisationHierarchyApi } from "../Api/organizationhierarchy.api";
import { runOrganisationHierarchyValidation } from "./organisation-hierarchy.harness";

test.describe("Organisation Hierarchy API", () => {
  test(
    "Validate Organisation Hierarchy API",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const api = new OrganisationHierarchyApi(authenticatedApi);
      await runOrganisationHierarchyValidation({
        api,
        testLabel: "Organisation Hierarchy API",
      });
    },
  );
});
