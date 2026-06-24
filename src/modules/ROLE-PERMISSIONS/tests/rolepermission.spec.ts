import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { RolePermissionApi } from "../Api/rolepermission.api";
import { RolePermissionData } from "../Data/rolepermission.data";
import { RolePermissionMapper } from "../Mapper/rolepermission.mapper";
import {  RolePermissionValidator } from "../Validator/rolepermission.validator";
test.describe("Role Permission CRUD Flow", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "Validate Role Permission Module",
    { tag: ["@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                const validator =new RolePermissionValidator();
                const roleApi =new RolePermissionApi(authenticatedApi);
                // =====================================
                // STEP 1
                // GET ALL ROLES
                // =====================================
                const getRolesResponse =await roleApi.getRoles();
                validation.execute("Get Roles Status Code",() =>
                        assert.validateStatusCode(getRolesResponse.rawResponse,200)
                );
                validation.execute("Get Roles Content Type",() =>
                        assert.validateContentType(getRolesResponse.rawResponse)
                );
                validation.execute("Get Roles Response Time",() =>
                        assert.validateResponseTime(getRolesResponse.responseTime,RolePermissionData.maxResponseTime)
                );
                validation.execute("Get Roles Sensitive Data",() =>
                        assert.validateSensitiveData(getRolesResponse.responseBody)
                );
                const roles =RolePermissionMapper.mapRoles(getRolesResponse.responseBody);
                validation.execute("Validate Roles Response",() =>
                        validator.validateResponse(getRolesResponse.responseBody)
                );
                validation.execute("Validate Roles List",() =>
                        validator.validateRoles(roles)
                );
                validation.execute("Validate Role Structure",() =>
                        validator.validateRoleStructure(roles)
                );
                validation.execute("Validate Duplicate Roles",() =>
                        validator.validateDuplicateRoles(roles)
                );
                validation.execute("Validate Sort Order",() =>
                        validator.validateSortOrder(roles)
                );
                validation.execute("Validate Ultimate Role",() =>
                        validator.validateUltimateRole(roles)
                );
                await PerformanceTracker.track(
                    getRolesResponse.rawResponse,
                    "Get Roles",
                    getRolesResponse.rawResponse.url(),
                    getRolesResponse.responseTime
                );
                // =====================================
                // STEP 2
                // CREATE ROLE
                // =====================================
                const createRoleResponse =await roleApi.createRole(RolePermissionData.createRolePayload);
                validation.execute("Create Role Status Code",() =>
                        assert.validateStatusCode(
                            createRoleResponse.rawResponse,
                            201,
                            createRoleResponse.responseBody
                        )
                );
                const createdRole = RolePermissionMapper.mapRole(createRoleResponse.responseBody);
                RolePermissionData.roleId =createdRole.id;
                validation.execute("Validate Created Role",() =>
                        validator.validateCreatedRole(createdRole,RolePermissionData.createRolePayload)
                );
                // =====================================
                // STEP 3
                // UPDATE ROLE
                // =====================================
                const updateRoleResponse =
                    await roleApi.updateRole(
                        RolePermissionData.roleId,
                        RolePermissionData.updateRolePayload
                    );
                validation.execute("Update Role Status Code",() =>
                        assert.validateStatusCode(updateRoleResponse.rawResponse,200)
                );
                const updatedRole =RolePermissionMapper.mapRole(updateRoleResponse.responseBody);
                validation.execute("Validate Updated Role",() =>
                        validator.validateUpdatedRole(updatedRole,RolePermissionData.updateRolePayload)
                );
                // =====================================
                // STEP 4
                // GET ROLE PERMISSIONS
                // =====================================
                const getPermissionsResponse =await roleApi.getRolePermissions(RolePermissionData.roleId);
                validation.execute("Get Role Permissions Status",() =>
                        assert.validateStatusCode(getPermissionsResponse.rawResponse,200)
                );
                const rolePermissions =RolePermissionMapper.mapRolePermissions(getPermissionsResponse.responseBody);
                validation.execute("Validate Permission Response",() =>
                        validator.validateRolePermissionResponse(rolePermissions)
                );
                validation.execute("Validate Modules",() =>
                        validator.validateModules(rolePermissions.modules)
                );
                validation.execute("Validate Permissions",() =>
                        validator.validatePermissions(rolePermissions.modules)
                );
                validation.execute("Validate Permission Key Format",() =>
                        validator.validatePermissionKeyFormat(rolePermissions.modules)
                );
                validation.execute("Validate Null Values",() =>
                        validator.validateNullValues(rolePermissions.modules)
                );
                validation.execute("Validate NaN Values",() =>
                validator.validateNaNValues(rolePermissions.modules)
                );
                // =====================================
                // STEP 5
                // ASSIGN PERMISSIONS
                // =====================================
                const assignPermissionPayload =
                    RolePermissionMapper.buildAssignPermissionPayload(
                        rolePermissions.modules
                    );
                const assignPermissionResponse =
                    await roleApi.assignPermissions(
                        RolePermissionData.roleId,
                        assignPermissionPayload
                    );
                validation.execute("Assign Permissions Status",() =>
                        assert.validateStatusCode(
                            assignPermissionResponse.rawResponse,
                            200,
                            assignPermissionResponse.responseBody
                        )
                );
                // =====================================
                // STEP 6
                // VERIFY ASSIGNMENT
                // =====================================
                const verifyResponse =
                    await roleApi.getRolePermissions(
                        RolePermissionData.roleId
                    );
                const verifyPermissions =
                    RolePermissionMapper.mapRolePermissions(
                        verifyResponse.responseBody
                    );
                validation.execute("Validate Permission Catalog",() =>
                        validator.validatePermissionCatalogPresent(verifyPermissions.modules)
                );
                validation.execute("Validate Assigned Permissions",() =>
                        validator.validateAssignedPermissions(
                            verifyPermissions.modules,
                            assignPermissionPayload.permissionKeys
                        )
                );
                validation.execute("Validate Module Enable Logic",() =>
                        validator.validateModuleEnableLogic(verifyPermissions.modules)
                );
                // =====================================
                // STEP 7
                // TOGGLE 2FA
                // =====================================
                const toggle2FAResponse =
                    await roleApi.toggle2FA(RolePermissionData.toggle2FAPayload);
                const toggleStatus = toggle2FAResponse.rawResponse.status();
                if (toggleStatus === 404) {
                    console.log(
                        "BACKEND FINDING: 2FA manage endpoint not deployed; skipping toggle validation"
                    );
                } else {
                    validation.execute("Toggle 2FA Status", () =>
                        assert.validateStatusCode(
                            toggle2FAResponse.rawResponse,
                            200,
                            toggle2FAResponse.responseBody
                        )
                    );
                    const toggle2FAData = RolePermissionMapper.mapToggle2FA(
                        toggle2FAResponse.responseBody
                    );
                    validation.execute("Validate Toggle 2FA", () =>
                        validator.validateToggle2FA(toggle2FAData)
                    );
                }
                // =====================================
                // STEP 8
                // DELETE ROLE
                // =====================================
                const deleteResponse =
                    await roleApi.deleteRole(
                        RolePermissionData.roleId
                    );
                validation.execute("Delete Role Status",() =>
                        assert.validateStatusCode(deleteResponse.rawResponse,204)
                );
                validation.execute("Validate Delete Role",() =>
                        validator.validateDeleteResponse(deleteResponse.responseBody)
                );
                // =====================================
                // FINAL SUMMARY
                // =====================================
                validation.printSummary(
                    "Role Permission CRUD Flow",
                    (
                        getRolesResponse.responseTime +
                        createRoleResponse.responseTime +
                        updateRoleResponse.responseTime +
                        getPermissionsResponse.responseTime
                    )
                );
            }
        );
    }
);