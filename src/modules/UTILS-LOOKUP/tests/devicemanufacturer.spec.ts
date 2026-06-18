// tests/devicemanufacturer.spec.ts
import { test } from "../../../../src/fixtures/api.fixture";
import { DeviceManufacturerApi } from "../Api/devicemanufacturer.api";
import {DeviceManufacturerMapper } from "../Mapper/devicemanufacturer.mapper";
import { DeviceManufacturerValidator } from "../Validator/devicemanufacturer.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";

import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Device Manufacturer API", () => {
  test("Validate Device Manufacturers",
    {
      tag: ["@smoke", "@manufacturer"],
    },
    async ({ authenticatedApi }) => {
      const api = new DeviceManufacturerApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getDeviceManufacturers();
        await PerformanceTracker.track(
          rawResponse,
          "Device Manufacturer API",
          `${process.env.BASE_URL}/indore/utils/device-manufacturers`,
          responseTime
        );  
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute("Content Validation", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, 60000),
      );
      validation.execute("Security Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      const data = DeviceManufacturerMapper.mapData(responseBody.data);
      const validator = new DeviceManufacturerValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
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
      validation.execute("Expected Manufacturers", () =>
        validator.validateExpectedManufacturers(data),
      );
      validation.printSummary("Device Manufacturer API", responseTime);
    },
  );
});
