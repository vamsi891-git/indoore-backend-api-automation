import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { UserManagementApi } from "../Api/usermanagement.api";
import {isAutomationAccount,UserDevicesTestConfig,UserManagementData,} from "../Data/usermanagement.data";
import { UserManagementMapper } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";
test.describe("User Admin — Negative", () => {
    test.describe.configure({ mode: "serial" });
    test("GET /users/:id — unknown user returns 404",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.getUserById(UserManagementData.unknownUserId);
            validation.execute("Status (not found)", () =>
                assert.validateStatusCode(rawResponse, 404, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [404,]),
            );
            validation.printSummary("Get User — Not Found", responseTime);
        },
    );
    test("PATCH /users/:id — unknown user returns 404",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.updateUser(UserManagementData.unknownUserId, {firstName: "Missing",});
            validation.execute("Status (not found)", () =>
                assert.validateStatusCode(rawResponse, 404, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    404,
                ]),
            );
            validation.printSummary("Update User — Not Found", responseTime);
        },
    );
    test("PATCH /users/:id — empty body returns 400",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const list = await userApi.getUsers(1, 5);
            const users = UserManagementMapper.mapUsers(list.responseBody).users;
            const target =users.find((user) => !isAutomationAccount(user)) ?? users[0];
            const { rawResponse, responseBody, responseTime } =
                await userApi.updateUser(
                    target.id,
                    UserManagementData.emptyUpdatePayload,
                );
            validation.execute("Status (empty patch)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [400,]),
            );
            validation.printSummary("Update User — Empty Body", responseTime);
        },
    );

    test(
        "PATCH /users/:id/status — invalid status returns 400",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const list = await userApi.getUsers(1, 5);
            const users = UserManagementMapper.mapUsers(list.responseBody).users;
            const target =
                users.find((user) => !isAutomationAccount(user)) ?? users[0];
            const { rawResponse, responseBody, responseTime } =
                await userApi.updateUserStatus(
                    target.id,
                    UserManagementData.invalidStatusPayload,
                );
            validation.execute("Status (invalid status)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    400,
                ]),
            );
            validation.printSummary("Update Status — Invalid", responseTime);
        },
    );
    test("PATCH /users/:id/status — unknown user returns 404",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.updateUserStatus(
                    UserManagementData.unknownUserId,
                    UserManagementData.updateStatusPayload,
                );
            validation.execute("Status (not found)", () =>
                assert.validateStatusCode(rawResponse, 404, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [404,]),
            );
            validation.printSummary("Update Status — Not Found", responseTime);
        },
    );

    test("GET /users/:id/devices — unknown user returns 404",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.getUserDevices(UserManagementData.unknownUserId);
            validation.execute("Status (not found)", () =>
                assert.validateStatusCode(rawResponse, 404, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [ 404,]),
            );
            validation.printSummary("Get Devices — User Not Found", responseTime);
        },
    );
    test("DELETE /users/:id/devices/:deviceId — unknown device returns 404",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.deleteDevice(
                    UserDevicesTestConfig.deviceTestUserId,
                    UserManagementData.unknownDeviceId,
                );
            validation.execute("Status (device not found)", () =>
                assert.validateStatusCode(rawResponse, 404, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [404,]),
            );
            validation.printSummary("Delete Device — Not Found", responseTime);
        },
    );

    test("DELETE /users/:id/devices/:deviceId — unknown user returns 404",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.deleteDevice(
                    UserManagementData.unknownUserId,
                    UserManagementData.unknownDeviceId,
                );
            validation.execute("Status (user not found)", () =>
                assert.validateStatusCode(rawResponse, 404, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    404,
                ]),
            );
            validation.printSummary("Delete Device — User Not Found", responseTime);
        },
    );
    test("POST /users/:id/force-logout — unknown user returns 404",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.forceLogout(UserManagementData.unknownUserId);
            validation.execute("Status (not found)", () =>
                assert.validateStatusCode(rawResponse, 404, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    404,
                ]),
            );
            validation.printSummary("Force Logout — Not Found", responseTime);
        },
    );
    test("GET /users/audit-logs — invalid page returns 400",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.getAuditLogs(
                    UserManagementData.invalidAuditLogPageQuery,
                );
            validation.execute("Status (invalid page)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [400,]),
            );
            validation.printSummary("Get Audit Logs — Invalid Page", responseTime);
        },
    );
    test("GET /users/audit-logs — invalid sort returns 400",
        { tag: ["@negative", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await userApi.getAuditLogs(UserManagementData.invalidAuditLogSortQuery,);
            validation.execute("Status (invalid sort)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [400,]),
            );
            validation.printSummary("Get Audit Logs — Invalid Sort", responseTime);
        },
    );
});
