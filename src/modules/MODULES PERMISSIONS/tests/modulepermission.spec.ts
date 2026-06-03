import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { ModulePermissionApi } from "../Api/modulepermission.api";
import { ModulePermissionData } from "../Data/modulepermission.data";
import { ModulePermissionMapper } from "../Mapper/modulepermission.mapper";
import {  ModulePermissionValidator } from "../Validator/modulepermission.validator";
test.describe("Module Permission CRUD Flow",() => {
        test("Validate Module Permission Module",
            async ({authenticatedApi}) => {
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                const validator =new ModulePermissionValidator();
                const moduleApi =new ModulePermissionApi(authenticatedApi);
                // =====================================
                // STEP 1
                // GET MODULES
                // =====================================
                const getModulesResponse = await moduleApi.getModules();
                validation.execute("Get Modules Status Code",() =>
                        assert.validateStatusCode(getModulesResponse.rawResponse,200)
                );
                validation.execute("Get Modules Content Type",() =>
                        assert.validateContentType(getModulesResponse.rawResponse)
                );
                validation.execute("Get Modules Response Time",() =>
                        assert.validateResponseTime(getModulesResponse.responseTime,ModulePermissionData.maxResponseTime)
                );
                validation.execute("Get Modules Sensitive Data",() =>
                        assert.validateSensitiveData(getModulesResponse.responseBody)
                );
                const modules =ModulePermissionMapper.mapModules(getModulesResponse.responseBody);
                validation.execute("Validate Root Response",() =>
                    validator.validateResponse(getModulesResponse.responseBody)
                );
                validation.execute("Validate Modules Exist",() =>
                        validator.validateModules(modules)
                );
                validation.execute("Validate Module Structure",() =>
                        validator.validateModuleStructure(modules)
                );
                validation.execute("Validate Module Business Rules",() =>
                        validator.validateModuleBusinessRules(modules)
                );
                validation.execute("Validate Duplicate Modules",() =>
                        validator.validateDuplicateModules(modules)
                );
                validation.execute("Validate Module Sorting",() =>
                        validator.validateModuleSorting(modules)
                );
                validation.execute("Validate Permission Structure",() =>
                        validator.validatePermissionStructure(modules)
                );
                validation.execute("Validate Permission Business Rules",() =>
                        validator.validatePermissionBusinessRules(modules)
                );
                validation.execute("Validate Duplicate Permissions",() =>
                        validator.validateDuplicatePermissions(modules)
                );
                validation.execute("Validate Permission Sorting",() =>
                        validator.validatePermissionSorting(modules)
                );
                validation.execute("Validate Parent Child Relation",() =>
                        validator.validateParentChildRelation(modules)
                );
                validation.execute("Validate Permission Pattern",() =>
                        validator.validatePermissionKeyPattern(modules)
                );
                validation.execute("Validate Null Values",() =>
                        validator.validateNullValues(modules)
                );
                validation.execute("Validate NaN Values",() =>
                        validator.validateNaNValues(modules)
                );
                await PerformanceTracker.track(
                    getModulesResponse.rawResponse,
                    "Get Modules",
                    getModulesResponse.rawResponse.url(),
                    getModulesResponse.responseTime
                );
                // =====================================
                // STEP 2
                // CREATE MODULE
                // =====================================
                const createModuleResponse =await moduleApi.createModule(ModulePermissionData.createModulePayload);
                validation.execute("Create Module Status Code",() =>
                        assert.validateStatusCode(createModuleResponse.rawResponse,201,createModuleResponse.responseBody)
                );
                validation.execute("Create Module Content Type",() =>
                        assert.validateContentType(createModuleResponse.rawResponse)
                );
                validation.execute("Create Module Response Time",() =>
                        assert.validateResponseTime(createModuleResponse.responseTime,ModulePermissionData.maxResponseTime)
                );
                const createdModule =ModulePermissionMapper.mapModule(createModuleResponse.responseBody);
                ModulePermissionData.moduleId =createdModule.id;
                validation.execute("Validate Created Module",() =>
                        validator.validateCreatedModule(createdModule,ModulePermissionData.createModulePayload)
                );
                await PerformanceTracker.track(
                    createModuleResponse.rawResponse,
                    "Create Module",
                    createModuleResponse.rawResponse.url(),
                    createModuleResponse.responseTime
                );
                // =====================================
                // STEP 3
                // UPDATE MODULE
                // =====================================
                const updateModuleResponse =await moduleApi.updateModule(ModulePermissionData.moduleId,ModulePermissionData.updateModulePayload);
                validation.execute("Update Module Status Code",() =>
                        assert.validateStatusCode(updateModuleResponse.rawResponse,200)
                );
                validation.execute("Update Module Content Type",() =>
                        assert.validateContentType(updateModuleResponse.rawResponse)
                );
                const updatedModule =ModulePermissionMapper.mapModule(updateModuleResponse.responseBody);
                validation.execute("Validate Updated Module",() =>
                        validator.validateUpdatedModule(updatedModule,ModulePermissionData.updateModulePayload)
                );
                await PerformanceTracker.track(
                    updateModuleResponse.rawResponse,
                    "Update Module",
                    updateModuleResponse.rawResponse.url(),
                    updateModuleResponse.responseTime
                );
                const moduleKey = updatedModule.key;
                ModulePermissionData.createPermissionPayload = {
                    key: `${moduleKey}.view`,
                    name: "View Automation",
                    description: "Permission Created By Automation",
                    sortOrder: 0
                };
                ModulePermissionData.updatePermissionPayload = {
                    key: `${moduleKey}.edit`,
                    name: "Edit Automation",
                    description: "Permission Updated By Automation",
                    sortOrder: 0
                };
                // =====================================
                // STEP 4
                // CREATE PERMISSION
                // =====================================
                const createPermissionResponse =
                    await moduleApi.createPermission(ModulePermissionData.moduleId,ModulePermissionData.createPermissionPayload);
                validation.execute("Create Permission Status Code",() =>
                        assert.validateStatusCode(createPermissionResponse.rawResponse,201,createPermissionResponse.responseBody)
                );
                validation.execute("Create Permission Content Type",() =>
                        assert.validateContentType(createPermissionResponse.rawResponse)
                );
                const createdPermission =ModulePermissionMapper.mapPermission(createPermissionResponse.responseBody);
                ModulePermissionData.permissionId = createdPermission.id;
                validation.execute("Validate Created Permission",() =>
                        validator.validateCreatedPermission(createdPermission,ModulePermissionData.createPermissionPayload)
                );
                await PerformanceTracker.track(
                    createPermissionResponse.rawResponse,
                    "Create Permission",
                    createPermissionResponse.rawResponse.url(),
                    createPermissionResponse.responseTime
                );
                // =====================================
                // STEP 5
                // UPDATE PERMISSION
                // =====================================
                const updatePermissionResponse = await moduleApi.updatePermission(ModulePermissionData.permissionId,ModulePermissionData.updatePermissionPayload);
                validation.execute("Update Permission Status Code",() =>
                        assert.validateStatusCode(updatePermissionResponse.rawResponse,200)
                );
                validation.execute("Update Permission Content Type",() =>
                        assert.validateContentType(updatePermissionResponse.rawResponse)
                );
                const updatedPermission =ModulePermissionMapper.mapPermission(updatePermissionResponse.responseBody);
                validation.execute("Validate Updated Permission",() =>
                        validator.validateUpdatedPermission(updatedPermission,ModulePermissionData.updatePermissionPayload)
                );
                await PerformanceTracker.track(
                updatePermissionResponse.rawResponse,
                "Update Permission",
                updatePermissionResponse.rawResponse.url(),
                updatePermissionResponse.responseTime
                );
                // PART B CONTINUES:
                // VERIFY MODULE
                // VERIFY PERMISSION
                // DELETE PERMISSION
                // VERIFY DELETE
                // DELETE MODULE
                // VERIFY DELETE
                // SUMMARY
                                // =====================================
                // STEP 6
                // VERIFY MODULE + PERMISSION
                // =====================================
                const verifyModulesResponse =await moduleApi.getModules();
                validation.execute("Verify Modules Status Code",() =>
                        assert.validateStatusCode(verifyModulesResponse.rawResponse,200)
                );
                const verifyModules =ModulePermissionMapper.mapModules(verifyModulesResponse.responseBody);
                const createdModuleAfterUpdate =verifyModules.find(module =>module.id ===ModulePermissionData.moduleId);
                validation.execute("Validate Module Exists After Update",() => {
                        expect(createdModuleAfterUpdate).toBeDefined();
                    }
                );
                validation.execute("Validate Updated Module Key",() => {
                        expect(createdModuleAfterUpdate?.key).toBe(ModulePermissionData.updateModulePayload.key
                        );
                    }
                );
                validation.execute("Validate Updated Module Name",() => {
                        expect(createdModuleAfterUpdate?.name).toBe(ModulePermissionData.updateModulePayload.name);
                    }
                );
                const updatedPermissionExists =createdModuleAfterUpdate?.permissions.find( permission => permission.id === ModulePermissionData.permissionId);
                validation.execute("Validate Permission Exists",() => {
                        expect(updatedPermissionExists).toBeDefined();
                    }
                );
                validation.execute("Validate Updated Permission Key",() => {
                        expect(updatedPermissionExists?.key).toBe(ModulePermissionData.updatePermissionPayload.key);
                    }
                );
                validation.execute("Validate Updated Permission Name",() => {
                        expect(updatedPermissionExists?.name).toBe(ModulePermissionData.updatePermissionPayload.name);
                    }
                );
                validation.execute("Validate Updated Permission Description",() => {
                        expect(updatedPermissionExists?.description).toBe(ModulePermissionData.updatePermissionPayload .description);
                    }
                );
                // =====================================
                // STEP 7
                // DELETE PERMISSION
                // =====================================
                const deletePermissionResponse =await moduleApi.deletePermission(ModulePermissionData.permissionId);
                validation.execute("Delete Permission Status",() =>
                        validator.validateDeletePermission(deletePermissionResponse.rawResponse.status())
                );
                // =====================================
                // STEP 8
                // VERIFY PERMISSION DELETED
                // =====================================
                const verifyPermissionDeletedResponse = await moduleApi.getModules();
                const modulesAfterPermissionDelete =
                    ModulePermissionMapper.mapModules(
                        verifyPermissionDeletedResponse
                            .responseBody
                    );
                const moduleAfterPermissionDelete =
                    modulesAfterPermissionDelete.find(
                        module =>
                            module.id ===
                            ModulePermissionData.moduleId
                    );
                const deletedPermission =moduleAfterPermissionDelete?.permissions.find(permission =>permission.id ===  ModulePermissionData.permissionId);
                validation.execute("Validate Permission Deleted",() => {
                        expect(deletedPermission).toBeUndefined();
                    }
                );
                // =====================================
                // STEP 9
                // DELETE MODULE
                // =====================================
                const deleteModuleResponse =await moduleApi.deleteModule(ModulePermissionData.moduleId);
                validation.execute("Delete Module Status",() =>
                        validator.validateDeleteModule(deleteModuleResponse.rawResponse.status())
                );
                // =====================================
                // STEP 10
                // VERIFY MODULE DELETED
                // =====================================
                const verifyModuleDeletedResponse =await moduleApi.getModules();
                validation.execute("Verify Module Delete Status",() =>
                        assert.validateStatusCode( verifyModuleDeletedResponse.rawResponse, 200)
                );
                const finalModules =
                    ModulePermissionMapper.mapModules(
                        verifyModuleDeletedResponse
                            .responseBody
                    );
                const deletedModule = finalModules.find(module =>module.id ===ModulePermissionData.moduleId);
                validation.execute("Validate Module Deleted",() => {
                        expect( deletedModule).toBeUndefined();
                    }
                );
                // =====================================
                // FINAL ASSERTION
                // =====================================
                assert.assertValidationResults(
                    validation.getResults()
                );
                // =====================================
                // FINAL SUMMARY
                // =====================================
                validation.printSummary(
                    "Module Permission CRUD Flow",
                    (
                        getModulesResponse.responseTime +
                        createModuleResponse.responseTime +
                        updateModuleResponse.responseTime +
                        createPermissionResponse.responseTime +
                        updatePermissionResponse.responseTime +
                        verifyModulesResponse.responseTime +
                        verifyPermissionDeletedResponse.responseTime +
                        verifyModuleDeletedResponse.responseTime
                    )
                );
            }
        );
    }
);