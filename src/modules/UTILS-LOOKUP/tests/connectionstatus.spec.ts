import { ConnectionStatusApi } from "../Api/connectionstatus.api";
import { ConnectionStatusMapper } from "../Mapper/connectionstatus.mapper";
import { ConnectionStatusValidator } from "../Validator/connectionstatus.validator";
import { connectionStatusTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { ConnectionStatusData } from "../Mapper/connectionstatus.mapper";
function validateConnectionStatus(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = ConnectionStatusMapper.mapData(
    getLookupResponseData<ConnectionStatusData>(responseBody),
  );
  const validator = new ConnectionStatusValidator();
  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Duplicate IDs", () =>
    validator.validateDuplicateIds(data),
  );
  validation.execute("Duplicate Names", () =>
    validator.validateDuplicateNames(data),
  );
  validation.execute("Ascending Order", () =>
    validator.validateAscendingOrder(data),
  );
  if (scenario === "smoke") {
    validation.execute("Expected Values", () =>
      validator.validateExpectedValues(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Connection Status API",
  testCases: connectionStatusTestCases,
  fetch: (api) => new ConnectionStatusApi(api).getConnectionStatuses(),
  validate: validateConnectionStatus,
});
