import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { UserManagementApi } from "../Api/usermanagement.api";
import {
    isAutomationAccount,
    UserManagementData
} from "../Data/usermanagement.data";
import { User, UserManagementMapper } from "../Mapper/usermanagement.mapper";
import { UserManagementValidator } from "../Validator/usermanagement.validator";
test.describe("User Security Flow",() => {
        test("Validate Force Logout",
            async ({authenticatedApi}) => {
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                const validator =new UserManagementValidator();
                const userApi =new UserManagementApi(authenticatedApi);
                // ==========================
                // GET USERS
                // ==========================
                const usersResponse =
                    await userApi.getUsers(1,20);
                validation.execute("Get Users Status Code",() =>
                        assert.validateStatusCode(usersResponse.rawResponse,200)
                );
                const usersData =UserManagementMapper.mapUsers(usersResponse.responseBody);
                const selectedUser =
                    usersData.users.find(
                        (u: User) => u.role === "manager" && !isAutomationAccount(u)
                    ) ||
                    usersData.users.find((u: User) => !isAutomationAccount(u)) ||
                    usersData.users[0];
                UserManagementData.userId =selectedUser.id;
                // ==========================
                // FORCE LOGOUT
                // ==========================
                const logoutResponse =await userApi.forceLogout(UserManagementData.userId);
                validation.execute("Force Logout Status Code",() =>
                        assert.validateStatusCode(logoutResponse.rawResponse,200)
                );
                validation.execute("Force Logout Content Type",() =>
                        assert.validateContentType(logoutResponse.rawResponse)
                );
                validation.execute("Force Logout Response Time",() =>
                        assert.validateResponseTime(logoutResponse.responseTime,UserManagementData.maxResponseTime)
                );
                const logoutResult =UserManagementMapper.mapForceLogout(logoutResponse.responseBody);
                validation.execute("Validate Force Logout",() =>
                        validator.validateForceLogout(logoutResult)
                );
                assert.assertValidationResults(
                    validation.getResults()
                );
                validation.printSummary(
                    "User Security Module",
                    logoutResponse.responseTime
                );
                await PerformanceTracker.track(
                    logoutResponse.rawResponse,
                    "Force Logout",
                    logoutResponse.rawResponse.url(),
                    logoutResponse.responseTime
                );
            }
        );
    }
);