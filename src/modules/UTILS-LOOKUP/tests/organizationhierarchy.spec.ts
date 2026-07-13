import { OrganisationApi } from "../Api/organizationhierarchy.api";
import { OrganisationMapper } from "../Mapper/organizationhierarchy.mapper";
import { OrganisationValidator } from "../Validator/organizationhierarchy.validator";
import { organizationHierarchyTestCases } from "../Data/hierarchies.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { HierarchyScenario } from "../Data/hierarchies.data";
import type { OrganisationData } from "../Mapper/organizationhierarchy.mapper";

function runOrganisationHierarchyValidations(
  scenario: HierarchyScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = OrganisationMapper.mapData(
    getLookupResponseData<OrganisationData>(responseBody),
  );
  const validator = new OrganisationValidator();

  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Duplicate Codes", () =>
    validator.validateDuplicateCodes(data),
  );
  validation.execute("Order Sequence", () =>
    validator.validateOrderSequence(data),
  );

  if (scenario === "smoke") {
    validation.execute("Expected Hierarchy", () =>
      validator.validateExpectedHierarchy(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Organisation Hierarchy API",
  testCases: organizationHierarchyTestCases,
  fetch: (authenticatedApi) =>
    new OrganisationApi(authenticatedApi).getOrganisationHierarchy(),
  validate: runOrganisationHierarchyValidations,
});
