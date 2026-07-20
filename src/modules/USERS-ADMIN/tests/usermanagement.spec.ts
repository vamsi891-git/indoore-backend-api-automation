import { test } from "../../../fixtures/api.fixture";
import { expect } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { UserManagementApi } from "../Api/usermanagement.api";
import {isAutomationAccount,UserDevicesTestConfig,UserManagementData,} from "../Data/usermanagement.data";
import { User, UserManagementMapper } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";
test.describe("User Management Flow", () => {
    test.describe.configure({ mode: "serial" });
    test("Validate User Management Module",
        { tag: ["@users-admin"] },
        async ({ authenticatedApi }) => {
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                const validator =new UserManagementValidator();
                const userApi =new UserManagementApi(authenticatedApi);
                // =====================================
                // GET USERS
                // =====================================
                const usersResponse =await userApi.getUsers(UserManagementData.page,UserManagementData.limit);
                validation.execute("Get Users Status Code",() =>
                        assert.validateStatusCode(usersResponse.rawResponse,200)
                );
                validation.execute("Get Users Content Type",() =>
                        assert.validateContentType(usersResponse.rawResponse)
                );
                validation.execute("Get Users Response Time",() =>
                        assert.validateResponseTime(usersResponse.responseTime,UserManagementData.maxResponseTime)
                );
                validation.execute("Get Users Sensitive Data",() =>
                        assert.validateSensitiveData(usersResponse.responseBody)
                );
                validation.execute("Validate Root Response",() =>
                        validator.validateResponse(usersResponse.responseBody)
                );
                const usersData =UserManagementMapper.mapUsers(usersResponse.responseBody);
                const users =usersData.users;
                const pagination =usersData.pagination;
                validation.execute("Validate Pagination",() =>
                        validator.validatePagination(pagination,users.length)
                );
                validation.execute("Validate Users Exist",() =>
                        validator.validateUsers(users)
                );
                validation.execute("Validate User Structure",() =>
                        validator.validateUserStructure(users)
                );
                validation.execute("Validate User Types",() =>
                    validator.validateUserTypes(users)
                );
                validation.execute("Validate Email Format",() =>
                        validator.validateEmailFormat(users)
                );
                validation.execute("Validate Duplicate Users",() =>
                        validator.validateDuplicateUsers(users)
                );
                validation.execute("Validate Role Rules",() =>
                        validator.validateRoleRules(users)
                );
                validation.execute("Validate Status Rules",() =>
                        validator.validateStatusRules(users)
                );
                validation.execute("Validate Session Rules",() =>
                        validator.validateSessionRules(users)
                );
                validation.execute("Validate Date Rules",() =>
                        validator.validateDates(users)
                );
                validation.execute("Validate Null Handling",() =>
                        validator.validateNullHandling(users)
                );
                validation.execute("Validate NaN Handling",() =>
                        validator.validateNaNValues(users)
                );
                const selectedUser =
                    users.find(
                        (user: User) =>
                            user.id === UserDevicesTestConfig.deviceTestUserId &&
                            !isAutomationAccount(user),
                    ) ??
                    users.find(
                        (user: User) =>
                            user.role.toLowerCase() === "manager" &&
                            !isAutomationAccount(user),
                    ) ??
                    users.find((user: User) => !isAutomationAccount(user)) ??
                    users[0];
                UserManagementData.userId = selectedUser.id;
                await PerformanceTracker.track(
        usersResponse.rawResponse,
        "Get Users",
        usersResponse.rawResponse.url(),
                    usersResponse.responseTime
                );
                // =====================================
                // GET USER BY ID
                // =====================================
                const userResponse =await userApi.getUserById(UserManagementData.userId);
                validation.execute("Get User Status Code",() =>
                        assert.validateStatusCode(userResponse.rawResponse,200)
                );
                const user = UserManagementMapper.mapUser(userResponse.responseBody);
                validation.execute("Validate User Id",() =>
                        validator.validateUserById(user,UserManagementData.userId)
                );
                validation.execute("Validate Created By",() =>
                        validator.validateCreatedBy(user)
                );
                validation.execute("Validate Invited By",() =>
                        validator.validateInvitedBy(user)
                );
                validation.execute("Validate Two Factor Rules",() =>
                        validator.validateTwoFactorRules(user)
                );
                UserManagementData.updateUserPayload =
                    UserManagementData.buildUpdateUserPayload(user);
                await PerformanceTracker.track(
        userResponse.rawResponse,
        "Get User By Id",
        userResponse.rawResponse.url(),
                    userResponse.responseTime
                );
                // =====================================
                // UPDATE USER
                // =====================================
                const updateUserResponse =await userApi.updateUser(UserManagementData.userId,UserManagementData.updateUserPayload);
                validation.execute("Update User Status Code",() =>
                        assert.validateStatusCode(updateUserResponse.rawResponse,200,updateUserResponse.responseBody)
                );
                validation.execute("Update User Content Type",() =>
                        assert.validateContentType(updateUserResponse.rawResponse)
                );
                const updatedUser =UserManagementMapper.mapUser(updateUserResponse.responseBody);
                validation.execute("Validate Updated User",() =>
                        validator.validateUpdatedUser(updatedUser,UserManagementData.updateUserPayload)
                );
                await PerformanceTracker.track(
        updateUserResponse.rawResponse,
        "Update User",
        updateUserResponse.rawResponse.url(),
                    updateUserResponse.responseTime
                );
                // =====================================
                // VERIFY USER UPDATE
                // =====================================
                const verifyUserResponse =await userApi.getUserById(UserManagementData.userId);
                const verifiedUser =UserManagementMapper.mapUser(verifyUserResponse.responseBody);
                validation.execute("Verify User Phone Updated",() => {
                        expect(verifiedUser.phone).toBe(UserManagementData.updateUserPayload.phone);
                    }
                );
                validation.execute("Verify Designation Updated",() => {
                        expect(verifiedUser.designation).toBe(UserManagementData.updateUserPayload.designation);
                    }
                );
                // =====================================
                // UPDATE STATUS
                // =====================================
                const statusResponse =await userApi.updateUserStatus(UserManagementData.userId,UserManagementData.updateStatusPayload);
                validation.execute("Update Status Status Code",() =>
                        assert.validateStatusCode(statusResponse.rawResponse,200)
                );
                const statusUser =UserManagementMapper.mapUser(statusResponse.responseBody);
                validation.execute("Validate Status Update",() =>
                        validator.validateStatusUpdate(statusUser,UserManagementData.updateStatusPayload.status)
                );
                await PerformanceTracker.track(
        statusResponse.rawResponse,
        "Update Status",
        statusResponse.rawResponse.url(),
                    statusResponse.responseTime
                );
                // =====================================
                // VERIFY STATUS UPDATE
                // =====================================
                const verifyStatusResponse =await userApi.getUserById(UserManagementData.userId);
                const verifiedStatusUser =UserManagementMapper.mapUser(verifyStatusResponse.responseBody);
                validation.execute("Verify Updated Status",() =>
                        validator.validateStatusUpdate(verifiedStatusUser,UserManagementData.updateStatusPayload.status)
                );
                // =====================================
                // FINAL ASSERTIONS
                // =====================================
                assert.assertValidationResults(
                    validation.getResults()
                );
                // =====================================
                // SUMMARY
                // =====================================
                validation.printSummary(
                    "User Management Module",
                    (
                        usersResponse.responseTime +
                        userResponse.responseTime +
                        updateUserResponse.responseTime +
                        verifyUserResponse.responseTime +
                        statusResponse.responseTime +
                        verifyStatusResponse.responseTime
                    )
                );

            }
        );
    }
);