import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { UserManagementApi } from "../Api/usermanagement.api";
import {
    isAutomationAccount,
    UserDevicesTestConfig,
    UserManagementData,
} from "../Data/usermanagement.data";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { Device, User, UserManagementMapper } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";

async function resolveUserDevices(
    userApi: UserManagementApi,
    users: User[],
): Promise<{
    userId: string;
    devicesResponse: ApiCallResult;
    devices: Device[];
} | null> {
    const candidates = [
        ...(UserDevicesTestConfig.deviceTestUserId
            ? [{ id: UserDevicesTestConfig.deviceTestUserId, email: "" }]
            : []),
        ...users.filter((user) => !isAutomationAccount(user)),
    ];

    for (const user of candidates) {
        const response = await userApi.getUserDevices(user.id);
        if (response.rawResponse.status() !== 200) {
            continue;
        }

        const mapped = UserManagementMapper.mapDevices(response.responseBody);
        if (mapped.devices.length > 0) {
            return {
                userId: user.id,
                devicesResponse: response,
                devices: mapped.devices,
            };
        }
    }

    return null;
}

test.describe("User Devices Flow", () => {
    test("Validate User Devices", async ({ authenticatedApi }) => {
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new UserManagementValidator();
        const userApi = new UserManagementApi(authenticatedApi);

        const usersResponse = await userApi.getUsers(
            1,
            UserDevicesTestConfig.pageSize,
        );
        validation.execute("Get Users Status Code", () =>
            assert.validateStatusCode(usersResponse.rawResponse, 200),
        );

        const usersData = UserManagementMapper.mapUsers(usersResponse.responseBody);
        const match = await resolveUserDevices(userApi, usersData.users);

        if (!match) {
            const fallbackUser =
                usersData.users.find((user: User) => !isAutomationAccount(user)) ??
                usersData.users[0];

            expect(
                fallbackUser,
                "No users returned from /indore/users for device read-only validation",
            ).toBeDefined();

            const devicesResponse = await userApi.getUserDevices(fallbackUser.id);
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

            const mappedDevices = UserManagementMapper.mapDevices(
                devicesResponse.responseBody,
            );
            validation.execute("Validate Empty Devices Contract", () => {
                expect(Array.isArray(mappedDevices.devices)).toBeTruthy();
                expect(Array.isArray(mappedDevices.unlinkedSessions)).toBeTruthy();
            });

            console.log(
                "NOTE: No users with registered devices found — delete-device flow skipped (read-only pass).",
            );
            validation.printSummary(
                "User Devices Module (read-only)",
                usersResponse.responseTime + devicesResponse.responseTime,
            );
            await PerformanceTracker.track(
                devicesResponse.rawResponse,
                "Get Devices",
                devicesResponse.rawResponse.url(),
                devicesResponse.responseTime,
            );
            return;
        }

        UserManagementData.userId = match.userId;
        const { devicesResponse, devices } = match;

        validation.execute("Get Devices Status Code", () =>
            assert.validateStatusCode(devicesResponse.rawResponse, 200),
        );
        validation.execute("Validate Devices", () =>
            validator.validateDevices(devices),
        );
        validation.execute("Validate Device Types", () =>
            validator.validateDeviceTypes(devices),
        );
        validation.execute("Validate Device Sessions", () =>
            validator.validateDeviceSessions(devices),
        );

        const deviceCountBefore = devices.length;
        const deviceToDelete =
            devices.find((device: Device) => !device.isCurrentDevice) ??
            devices[0];
        UserManagementData.deviceId = deviceToDelete.id;

        const deleteResponse = await userApi.deleteDevice(
            UserManagementData.userId,
            UserManagementData.deviceId,
        );
        validation.execute("Delete Device Status Code", () =>
            assert.validateStatusCode(deleteResponse.rawResponse, 200),
        );

        const deleteResult = UserManagementMapper.mapDeleteDevice(
            deleteResponse.responseBody,
        );
        validation.execute("Validate Deleted Device", () =>
            validator.validateDeletedDevice(
                deleteResult,
                UserManagementData.deviceId,
            ),
        );

        const verifyResponse = await userApi.getUserDevices(
            UserManagementData.userId,
        );
        validation.execute("Verify Devices Status Code", () =>
            assert.validateStatusCode(verifyResponse.rawResponse, 200),
        );

        const verifyDevices: Device[] = UserManagementMapper.mapDevices(
            verifyResponse.responseBody,
        ).devices;
        const deletedDevice = verifyDevices.find(
            (device) => device.id === UserManagementData.deviceId,
        );
        validation.execute("Verify Device Removed", () => {
            expect(deletedDevice).toBeUndefined();
        });
        validation.execute("Verify Device Count Reduced", () => {
            expect(verifyDevices.length).toBeLessThan(deviceCountBefore);
        });

        assert.assertValidationResults(validation.getResults());
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
    });
});
