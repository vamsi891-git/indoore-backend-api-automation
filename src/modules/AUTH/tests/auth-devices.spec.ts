import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { UserManagementValidator } from "../../USERS-ADMIN/Validator/usermanagement.validator";
import { AuthSessionApi } from "../Api/auth-session.api";
import { AuthTestData } from "../Data/auth.data";
import { AuthMapper } from "../Mapper/auth.mapper";
import { AuthValidator } from "../Validator/auth.validator";
import { AuthDevicesResponseSchema } from "../schemas/auth.schemas";

test.describe("Auth Devices API", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "Validate GET /auth/devices — session device catalog",
    { tag: ["@smoke", "@auth"] },
    async ({ authenticatedApi }) => {
      const api = new AuthSessionApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();
      const deviceValidator = new UserManagementValidator();

      const { rawResponse, responseBody, responseTime } = await api.getDevices();

      await PerformanceTracker.track(
        rawResponse,
        "Auth Devices API",
        rawResponse.url(),
        responseTime
      );

      validation.execute("Devices Status Code", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Devices Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Devices Response Time", () =>
        assert.validateResponseTime(
          responseTime,
          AuthTestData.maxResponseTimeMs,
        ),
      );
      validation.execute("Devices Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );
      validation.execute("Devices Success Envelope", () =>
        validator.validateSuccessEnvelope(responseBody),
      );

      validation.execute("Devices Zod Contract", () => {
        const result = AuthDevicesResponseSchema.safeParse(responseBody);
        expect(
          result.success,
          result.success
            ? "Zod validation passed"
            : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
        ).toBe(true);
      });

      const mapped = AuthMapper.mapAuthDevices(responseBody);
      validation.execute("Devices Response Shape", () =>
        deviceValidator.validateDevicesResponse(mapped),
      );
      validation.execute("Device Groups", () =>
        deviceValidator.validateDeviceGroups(mapped.deviceGroups),
      );

      if (mapped.devices.length === 0) {
        validation.execute("Empty Devices Contract", () =>
          deviceValidator.validateEmptyDevicesContract(mapped),
        );
      } else {
        validation.execute("Devices", () =>
          deviceValidator.validateDevices(mapped.devices),
        );
        validation.execute("Device Types", () =>
          deviceValidator.validateDeviceTypes(mapped.devices),
        );
        validation.execute("Device Sessions", () =>
          deviceValidator.validateDeviceSessions(mapped.devices),
        );
      }

      validation.printSummary("Auth Devices API", responseTime);
    },
  );

  test(
    "DELETE /auth/devices/:id — revoke non-current device and verify catalog",
    { tag: ["@auth"] },
    async ({ authenticatedApi }) => {
      const api = new AuthSessionApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();
      const deviceValidator = new UserManagementValidator();

      const listResponse = await api.getDevices();
      validation.execute("List Devices Status Code", () =>
        assert.validateStatusCode(listResponse.rawResponse, 200),
      );

      const mapped = AuthMapper.mapAuthDevices(listResponse.responseBody);
      if (mapped.devices.length === 0) {
        test.skip(true, "No devices registered for current session user");
      }

      const deviceToDelete = AuthMapper.pickDeletableDevice(mapped.devices);
      if (!deviceToDelete) {
        test.skip(true, "No non-current device available to revoke");
      }

      const deleteResponse = await api.deleteDevice(deviceToDelete!.id);
      validation.execute("Delete Device Status Code", () =>
        assert.validateStatusCode(
          deleteResponse.rawResponse,
          200,
          deleteResponse.responseBody,
        ),
      );
      validation.execute("Delete Device Content Type", () =>
        assert.validateContentType(deleteResponse.rawResponse),
      );
      validation.execute("Delete Device Success Envelope", () =>
        validator.validateSuccessEnvelope(deleteResponse.responseBody),
      );

      const deleteResult = AuthMapper.mapDeleteDevice(deleteResponse.responseBody);
      validation.execute("Validate Deleted Device Response", () =>
        deviceValidator.validateDeletedDevice(deleteResult, deviceToDelete!.id),
      );

      const verifyResponse = await api.getDevices();
      const verifyMapped = AuthMapper.mapAuthDevices(verifyResponse.responseBody);
      validation.execute("Verify Device Revoked Or Removed", () => {
        const device = verifyMapped.devices.find(
          (entry) => entry.id === deviceToDelete!.id,
        );
        if (device) {
          expect(device.revokedAt).toBeTruthy();
        } else {
          expect(device).toBeUndefined();
        }
      });

      await PerformanceTracker.track(
        deleteResponse.rawResponse,
        "Auth Delete Device",
        deleteResponse.rawResponse.url(),
        deleteResponse.responseTime,
      );

      validation.printSummary(
        "Auth Delete Device",
        listResponse.responseTime + deleteResponse.responseTime,
      );
    },
  );

  test(
    "DELETE /auth/devices/:id — unknown device returns 404",
    { tag: ["@negative", "@auth"] },
    async ({ authenticatedApi }) => {
      const api = new AuthSessionApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new AuthValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.deleteDevice(AuthTestData.unknownDeviceId);

      validation.execute("Status (not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorEnvelope(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Auth Delete Device — Not Found", responseTime);
    },
  );
});
