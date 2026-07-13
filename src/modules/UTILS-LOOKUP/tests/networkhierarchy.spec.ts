import { NetworkApi } from "../Api/networkhierarchy.api";
import { NetworkMapper } from "../Mapper/networkhierarchy.mapper";
import { NetworkValidator } from "../Validator/networkhierarchy.validator";
import { networkHierarchyTestCases } from "../Data/hierarchies.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { HierarchyScenario } from "../Data/hierarchies.data";
import type { NetworkData } from "../Mapper/networkhierarchy.mapper";

function runNetworkHierarchyValidations(
  scenario: HierarchyScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = NetworkMapper.mapData(
    getLookupResponseData<NetworkData>(responseBody),
  );
  const validator = new NetworkValidator();

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
  describeTitle: "Network Hierarchy API",
  testCases: networkHierarchyTestCases,
  fetch: (authenticatedApi) =>
    new NetworkApi(authenticatedApi).getNetworkHierarchy(),
  validate: runNetworkHierarchyValidations,
});
