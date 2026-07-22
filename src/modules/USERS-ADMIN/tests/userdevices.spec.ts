import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { UserManagementApi } from "../Api/usermanagement.api";
import { UserManagementData } from "../Data/usermanagement.data";
import { UserManagementMapper } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";
import { resolveLiveDeviceTestUserId } from "../utils/resolve-device-test-user";

test.describe("User Devices Flow", () => {
  test.describe.configure({ mode: "serial" });
  test(
    "Validate User Devices",
    { tag: ["@users-admin"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new UserManagementValidator();
      const userApi = new UserManagementApi(authenticatedApi);
      const userId = await resolveLiveDeviceTestUserId(authenticatedApi);
      const devicesResponse = await userApi.getUserDevices(userId);
      validation.execute("Get Devices Status Code", () =>
        assert.validateStatusCode(devicesResponse.rawResponse, 200),
      );
      validation.execute("Get Devices Content Type", () =>
        assert.validateContentType(devicesResponse.rawResponse),
      );
      validation.execute("Get Devices Response Time", () =>
        assert.validateResponseTime(
          devicesResponse.responseTime,
          UserManagementData.maxResponseTime,
        ),
      );
      const mapped = UserManagementMapper.mapDevices(
        devicesResponse.responseBody,
      );
      validation.execute("Validate Devices Response Shape", () =>
        validator.validateDevicesResponse(mapped),
      );
      validation.execute("Validate Device Groups", () =>
        validator.validateDeviceGroups(mapped.deviceGroups),
      );
      if (mapped.devices.length === 0) {
        validation.execute("Validate Empty Devices Contract", () =>
          validator.validateEmptyDevicesContract(mapped),
        );
        validation.printSummary(
          "User Devices Module (read-only)",
          devicesResponse.responseTime,
        );
        await PerformanceTracker.track(
          devicesResponse.rawResponse,
          "Get Devices",
          devicesResponse.rawResponse.url(),
          devicesResponse.responseTime,
        );
        return;
      }
      validation.execute("Validate Devices", () =>
        validator.validateDevices(mapped.devices),
      );
      validation.execute("Validate Device Types", () =>
        validator.validateDeviceTypes(mapped.devices),
      );
      validation.execute("Validate Device Sessions", () =>
        validator.validateDeviceSessions(mapped.devices),
      );
      const deviceCountBefore = mapped.devices.length;
      const deviceToDelete = UserManagementMapper.pickDeletableDevice(
        mapped.devices,
      );
      expect(deviceToDelete).toBeDefined();
      const deleteResponse = await userApi.deleteDevice(
        userId,
        deviceToDelete!.id,
      );
      validation.execute("Delete Device Status Code", () =>
        assert.validateStatusCode(
          deleteResponse.rawResponse,
          200,
          deleteResponse.responseBody,
        ),
      );
      const deleteResult = UserManagementMapper.mapDeleteDevice(
        deleteResponse.responseBody,
      );
      validation.execute("Validate Deleted Device", () =>
        validator.validateDeletedDevice(deleteResult, deviceToDelete!.id),
      );
      const verifyResponse = await userApi.getUserDevices(userId);
      const verifyMapped = UserManagementMapper.mapDevices(
        verifyResponse.responseBody,
      );
      validation.execute("Verify Device Removed", () => {
        expect(
          verifyMapped.devices.find(
            (device) => device.id === deviceToDelete!.id,
          ),
        ).toBeUndefined();
      });
      validation.execute("Verify Device Count Reduced", () => {
        expect(verifyMapped.devices.length).toBeLessThan(deviceCountBefore);
      });
      validation.printSummary(
        "User Devices Module",
        devicesResponse.responseTime +
          deleteResponse.responseTime +
          verifyResponse.responseTime,
      );
      await PerformanceTracker.track(
        devicesResponse.rawResponse,
        "Get Devices",
        devicesResponse.rawResponse.url(),
        devicesResponse.responseTime,
      );
    },
  );
});
