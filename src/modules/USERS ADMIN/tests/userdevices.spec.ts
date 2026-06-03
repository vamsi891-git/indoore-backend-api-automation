import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { UserManagementApi } from "../Api/usermanagement.api";
import { isAutomationAccount, UserManagementData } from "../Data/usermanagement.data";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { Device, UserManagementMapper } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";
test.describe("User Devices Flow",() => {
        test("Validate User Devices",async ({authenticatedApi}) => {
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                const validator =new UserManagementValidator();
                const userApi =new UserManagementApi(authenticatedApi);
                // ==========================
                // GET USERS
                // ==========================
                const usersResponse =await userApi.getUsers(1,20);
                validation.execute("Get Users Status Code",() =>
                        assert.validateStatusCode(usersResponse.rawResponse,200)
                );
                const usersData =UserManagementMapper.mapUsers(usersResponse.responseBody);
                let devicesResponse: ApiCallResult | undefined;
                let devices: Device[] = [];
                for (const user of usersData.users) {
                    if (isAutomationAccount(user)) {
                        continue;
                    }
                    const response =await userApi.getUserDevices(user.id);
                    if (response.rawResponse.status() !== 200) {
                        continue;
                    }
                    const mappedDevices =UserManagementMapper.mapDevices(response.responseBody);
                    if (mappedDevices.devices.length > 0) {
                        UserManagementData.userId = user.id;
                        devicesResponse = response;
                        devices = mappedDevices.devices;
                        break;
                    }
                }
                expect(devices.length,"No users with registered devices found for device delete flow").toBeGreaterThan(0);
                if (!devicesResponse) {
                    throw new Error("devicesResponse is undefined after user selection");
                }
                validation.execute("Get Devices Status Code",() =>
                        assert.validateStatusCode(devicesResponse.rawResponse,200)
                );
                validation.execute("Validate Devices",() =>
                        validator.validateDevices(devices)
                );
                validation.execute("Validate Device Types",() =>
                        validator.validateDeviceTypes(devices)
                );
                validation.execute("Validate Device Sessions",() =>
                        validator.validateDeviceSessions(devices)
                );
                const deviceCountBefore =devices.length;
                const deviceToDelete =
                    devices.find((d) => !d.isCurrentDevice) ?? devices[0];
                UserManagementData.deviceId =deviceToDelete.id;
                // ==========================
                // DELETE DEVICE
                // ==========================
                const deleteResponse =
                    await userApi.deleteDevice(
                        UserManagementData.userId,
                        UserManagementData.deviceId
                    );
                validation.execute("Delete Device Status Code",() =>
                        assert.validateStatusCode(deleteResponse.rawResponse,200)
                );
                const deleteResult =UserManagementMapper.mapDeleteDevice(deleteResponse.responseBody);
                validation.execute("Validate Deleted Device",() =>
                        validator.validateDeletedDevice(deleteResult,UserManagementData.deviceId)
                );
                // ==========================
                // VERIFY DELETE
                // ==========================
                const verifyResponse =await userApi.getUserDevices(UserManagementData.userId);
                validation.execute("Verify Devices Status Code",() =>
                        assert.validateStatusCode(verifyResponse.rawResponse,200)
                );
                const verifyDevices: Device[] =UserManagementMapper.mapDevices(verifyResponse.responseBody).devices;
                const deletedDevice =verifyDevices.find((device: Device) =>device.id ===UserManagementData.deviceId);
                validation.execute("Verify Device Removed",() => {
                        expect(deletedDevice).toBeUndefined();
                    }
                );
                validation.execute("Verify Device Count Reduced",() => {
                        expect(verifyDevices.length).toBeLessThan(deviceCountBefore);
                    }
                );
                assert.assertValidationResults(validation.getResults());
                validation.printSummary(
                    "User Devices Module",
                    devicesResponse.responseTime +
                    deleteResponse.responseTime +
                    verifyResponse.responseTime
                );
                await PerformanceTracker.track(
                    devicesResponse.rawResponse,
                    "Get Devices",
                    devicesResponse.rawResponse.url(),
                    devicesResponse.responseTime
                );
            }
        );
    }
);