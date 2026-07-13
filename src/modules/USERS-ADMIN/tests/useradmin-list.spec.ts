import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { UserManagementApi } from "../Api/usermanagement.api";
import {
    isAutomationAccount,
    UserDevicesTestConfig,
    UserManagementData,
} from "../Data/usermanagement.data";
import { UserManagementMapper } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";

test.describe("User Admin — List", () => {
    test.describe.configure({ mode: "serial" });

    test(
        "Validate GET /users — user catalog",
        { tag: ["@smoke", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);

            const response = await userApi.getUsers(
                UserManagementData.page,
                UserManagementData.limit,
            );

            validation.execute("Get Users Status Code", () =>
                assert.validateStatusCode(response.rawResponse, 200),
            );
            validation.execute("Get Users Content Type", () =>
                assert.validateContentType(response.rawResponse),
            );
            validation.execute("Get Users Response Time", () =>
                assert.validateResponseTime(
                    response.responseTime,
                    UserManagementData.maxResponseTime,
                ),
            );
            validation.execute("Get Users Sensitive Data", () =>
                assert.validateSensitiveData(response.responseBody),
            );

            await PerformanceTracker.track(
        response.rawResponse,
        "Get Users",
        response.rawResponse.url(),
                response.responseTime,
            );

            validation.execute("Validate Root Response", () =>
                validator.validateResponse(response.responseBody),
            );

            const usersData = UserManagementMapper.mapUsers(response.responseBody);
            validation.execute("Validate Pagination", () =>
                validator.validatePagination(
                    usersData.pagination,
                    usersData.users.length,
                ),
            );
            validation.execute("Validate Users Exist", () =>
                validator.validateUsers(usersData.users),
            );
            validation.execute("Validate User Structure", () =>
                validator.validateUserStructure(usersData.users),
            );
            validation.execute("Validate Duplicate Users", () =>
                validator.validateDuplicateUsers(usersData.users),
            );
            validation.execute("Validate Status Rules", () =>
                validator.validateStatusRules(usersData.users),
            );

            validation.printSummary("Get Users", response.responseTime);
        },
    );

    test(
        "Validate GET /users/:id — user detail",
        { tag: ["@smoke", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);

            const listResponse = await userApi.getUsers(1, UserManagementData.limit);
            const users = UserManagementMapper.mapUsers(listResponse.responseBody).users;
            const targetUser =
                users.find((user) => user.id === UserDevicesTestConfig.deviceTestUserId) ??
                users.find((user) => !isAutomationAccount(user)) ??
                users[0];

            const response = await userApi.getUserById(targetUser.id);
            validation.execute("Get User Status Code", () =>
                assert.validateStatusCode(response.rawResponse, 200),
            );

            const user = UserManagementMapper.mapUser(response.responseBody);
            validation.execute("Validate User Id", () =>
                validator.validateUserById(user, targetUser.id),
            );
            validation.execute("Validate Created By", () =>
                validator.validateCreatedBy(user),
            );
            validation.execute("Validate Invited By", () =>
                validator.validateInvitedBy(user),
            );
            validation.execute("Validate Two Factor Rules", () =>
                validator.validateTwoFactorRules(user),
            );
            validation.execute("Validate Session Rules", () =>
                validator.validateSessionRules([user]),
            );

            validation.printSummary("Get User By Id", response.responseTime);
        },
    );

    test(
        "Validate GET /users/:id/devices — device groups catalog",
        { tag: ["@smoke", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);

            const response = await userApi.getUserDevices(
                UserDevicesTestConfig.deviceTestUserId,
            );
            validation.execute("Get Devices Status Code", () =>
                assert.validateStatusCode(response.rawResponse, 200),
            );
            validation.execute("Get Devices Content Type", () =>
                assert.validateContentType(response.rawResponse),
            );

            const mapped = UserManagementMapper.mapDevices(response.responseBody);
            validation.execute("Validate Devices Response Shape", () =>
                validator.validateDevicesResponse(mapped),
            );
            validation.execute("Validate Device Groups", () =>
                validator.validateDeviceGroups(mapped.deviceGroups),
            );
            validation.execute("Validate Devices", () =>
                validator.validateDevices(mapped.devices),
            );
            validation.execute("Validate Device Types", () =>
                validator.validateDeviceTypes(mapped.devices),
            );

            validation.printSummary("Get User Devices", response.responseTime);
        },
    );

    test(
        "Validate GET /users/audit-logs — audit log catalog",
        { tag: ["@smoke", "@users-admin"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new UserManagementValidator();
            const userApi = new UserManagementApi(authenticatedApi);

            const response = await userApi.getAuditLogs(
                UserManagementData.auditLogQuery,
            );
            validation.execute("Get Audit Logs Status Code", () =>
                assert.validateStatusCode(response.rawResponse, 200),
            );
            validation.execute("Get Audit Logs Content Type", () =>
                assert.validateContentType(response.rawResponse),
            );
            validation.execute("Get Audit Logs Response Time", () =>
                assert.validateResponseTime(
                    response.responseTime,
                    UserManagementData.maxResponseTime,
                ),
            );
            validation.execute("Get Audit Logs Sensitive Data", () =>
                assert.validateSensitiveData(response.responseBody),
            );

            await PerformanceTracker.track(
        response.rawResponse,
        "Get Audit Logs",
        response.rawResponse.url(),
                response.responseTime,
            );

            validation.execute("Validate Root Response", () =>
                validator.validateResponse(response.responseBody),
            );

            const mapped = UserManagementMapper.mapAuditLogs(
                response.responseBody,
            );
            validation.execute("Validate Audit Logs Pagination", () =>
                validator.validateAuditLogsPagination(
                    mapped.pagination,
                    mapped.logs.length,
                ),
            );
            validation.execute("Validate Audit Logs Exist", () =>
                validator.validateAuditLogsExist(mapped.logs),
            );
            validation.execute("Validate Audit Log Structure", () =>
                validator.validateAuditLogStructure(mapped.logs),
            );
            validation.execute("Validate Duplicate Audit Log Ids", () =>
                validator.validateDuplicateAuditLogIds(mapped.logs),
            );
            validation.execute("Validate Audit Log Sort Order", () =>
                validator.validateAuditLogSortNewestFirst(mapped.logs),
            );
            validation.execute("Validate Action Filter Options", () =>
                validator.validateActionFilterOptions(mapped.actionFilterOptions),
            );

            validation.printSummary("Get Audit Logs", response.responseTime);
        },
    );
});
