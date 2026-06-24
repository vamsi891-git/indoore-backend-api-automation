import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
    isAutomationAccount,
    UserDevicesTestConfig,
    UserManagementData,
} from "../Data/usermanagement.data";
import { UserManagementApi } from "../Api/usermanagement.api";
import { UserManagementMapper, User } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";

test.describe("User Admin — Advanced", () => {
    test.describe.configure({ mode: "serial" });

    test(
        "DELETE /users/:id/devices/:deviceId — revoke device and verify catalog",
        { tag: ["@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const userId = UserDevicesTestConfig.deviceTestUserId;

            const listResponse = await userApi.getUserDevices(userId);
            validation.execute("Get Devices Status Code", () =>
                assert.validateStatusCode(listResponse.rawResponse, 200),
            );

            const mapped = UserManagementMapper.mapDevices(listResponse.responseBody);
            validation.execute("Validate Device Groups", () =>
                validator.validateDeviceGroups(mapped.deviceGroups),
            );

            if (mapped.devices.length === 0) {
                test.skip(true, "No devices registered for device test user");
            }

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
            validation.execute("Validate Deleted Device Response", () =>
                validator.validateDeletedDevice(deleteResult, deviceToDelete!.id),
            );

            const verifyResponse = await userApi.getUserDevices(userId);
            const verifyMapped = UserManagementMapper.mapDevices(
                verifyResponse.responseBody,
            );
            validation.execute("Verify Device Removed From Catalog", () => {
                expect(
                    verifyMapped.devices.find(
                        (device) => device.id === deviceToDelete!.id,
                    ),
                ).toBeUndefined();
                expect(verifyMapped.devices.length).toBeLessThan(
                    mapped.devices.length,
                );
            });

            validation.printSummary(
                "Delete User Device",
                listResponse.responseTime + deleteResponse.responseTime,
            );
        },
    );

    test(
        "PATCH /users/:id/status — suspend then restore active",
        { tag: ["@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);

            const listResponse = await userApi.getUsers(1, UserManagementData.limit);
            const users = UserManagementMapper.mapUsers(listResponse.responseBody).users;
            const targetUser =
                users.find(
                    (user: User) =>
                        user.id === UserDevicesTestConfig.deviceTestUserId &&
                        !isAutomationAccount(user),
                ) ??
                users.find((user: User) => !isAutomationAccount(user));

            if (!targetUser) {
                test.skip(true, "No suitable user for status toggle test");
            }

            const suspendResponse = await userApi.updateUserStatus(
                targetUser!.id,
                UserManagementData.suspendStatusPayload,
            );
            validation.execute("Suspend Status Code", () =>
                assert.validateStatusCode(
                    suspendResponse.rawResponse,
                    200,
                    suspendResponse.responseBody,
                ),
            );

            const suspendedUser = UserManagementMapper.mapUser(
                suspendResponse.responseBody,
            );
            validation.execute("Validate Suspended Status", () =>
                validator.validateStatusUpdate(
                    suspendedUser,
                    UserManagementData.suspendStatusPayload.status,
                ),
            );

            const restoreResponse = await userApi.updateUserStatus(
                targetUser!.id,
                UserManagementData.activeStatusPayload,
            );
            validation.execute("Restore Active Status Code", () =>
                assert.validateStatusCode(
                    restoreResponse.rawResponse,
                    200,
                    restoreResponse.responseBody,
                ),
            );

            const restoredUser = UserManagementMapper.mapUser(
                restoreResponse.responseBody,
            );
            validation.execute("Validate Restored Active Status", () =>
                validator.validateStatusUpdate(
                    restoredUser,
                    UserManagementData.activeStatusPayload.status,
                ),
            );

            const verifyResponse = await userApi.getUserById(targetUser!.id);
            const verifiedUser = UserManagementMapper.mapUser(
                verifyResponse.responseBody,
            );
            validation.execute("Verify Status Persisted", () =>
                validator.validateStatusUpdate(
                    verifiedUser,
                    UserManagementData.activeStatusPayload.status,
                ),
            );

            validation.printSummary(
                "User Status Toggle",
                suspendResponse.responseTime + restoreResponse.responseTime,
            );
        },
    );

    test(
        "GET /users/audit-logs — filter by action",
        { tag: ["@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);

            const response = await userApi.getAuditLogs(
                UserManagementData.auditLogActionFilter,
            );
            validation.execute("Filtered audit logs status", () =>
                assert.validateStatusCode(
                    response.rawResponse,
                    200,
                    response.responseBody,
                ),
            );

            const mapped = UserManagementMapper.mapAuditLogs(
                response.responseBody,
            );
            validation.execute("All logs match action filter", () =>
                validator.validateAuditLogActionFilter(
                    mapped.logs,
                    UserManagementData.auditLogActionFilter.action,
                ),
            );
            validation.execute("Filtered logs sorted newest first", () =>
                validator.validateAuditLogSortNewestFirst(mapped.logs),
            );

            validation.printSummary("Audit Logs Action Filter", response.responseTime);
        },
    );
});
