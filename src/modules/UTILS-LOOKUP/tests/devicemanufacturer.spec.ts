import { DeviceManufacturerApi } from "../Api/devicemanufacturer.api";
import { DeviceManufacturerMapper } from "../Mapper/devicemanufacturer.mapper";
import { DeviceManufacturerValidator } from "../Validator/devicemanufacturer.validator";
import { deviceManufacturerTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { DeviceManufacturerData } from "../Mapper/devicemanufacturer.mapper";

function validateDeviceManufacturer(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = DeviceManufacturerMapper.mapData(
    getLookupResponseData<DeviceManufacturerData>(responseBody),
  );
  const validator = new DeviceManufacturerValidator();
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
  validation.execute("Backend Rules", () =>
    validator.validateBackendRules(data),
  );
  if (scenario === "smoke") {
    validation.execute("Expected Manufacturers", () =>
      validator.validateExpectedManufacturers(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Device Manufacturer API",
  endpoint: "/indore/utils/device-manufacturers",
  testCases: deviceManufacturerTestCases,
  fetch: (api) => new DeviceManufacturerApi(api).getDeviceManufacturers(),
  validate: validateDeviceManufacturer,
});
