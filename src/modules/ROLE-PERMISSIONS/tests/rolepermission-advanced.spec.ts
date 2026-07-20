import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { RolePermissionApi } from "../Api/rolepermission.api";
import { RolePermissionData } from "../Data/rolepermission.data";
import { RolePermissionMapper } from "../Mapper/rolepermission.mapper";
import { RolePermissionValidator } from "../Validator/rolepermission.validator";

test.describe("Role Permission — Advanced", () => {
  test.describe.configure({ mode: "serial" });
  test("PUT /roles/:roleId/modules/:moduleId — toggle module enabled",
    { tag: ["@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);
      const payload = RolePermissionData.buildUniqueRolePayload();
      const created = await roleApi.createRole(payload);
      validation.execute("Create role for module toggle", () =>
        assert.validateStatusCode(created.rawResponse, 201, created.responseBody),
      );
      const roleId = RolePermissionMapper.mapRole(created.responseBody).id;
      const catalog = await roleApi.getRolePermissions(roleId);
      const modules = RolePermissionMapper.mapRolePermissions(catalog.responseBody,).modules;
      const targetModule =RolePermissionMapper.findModule(modules,RolePermissionData.preferredModuleKey,) ?? modules[0];
      if (!targetModule) {
        test.skip(true, "Role permission catalog has no modules");
      }
      const disableResponse = await roleApi.setRoleModuleEnabled(
        roleId,
        targetModule!.moduleId,
        RolePermissionData.setModuleEnabledPayload,
      );
      validation.execute("Disable module status", () =>
        assert.validateStatusCode(
          disableResponse.rawResponse,
          200,
          disableResponse.responseBody,
        ),
      );
      const afterDisable = await roleApi.getRolePermissions(roleId);
      const disabledModules = RolePermissionMapper.mapRolePermissions(
        afterDisable.responseBody,
      ).modules;
      validation.execute("Module disabled in catalog", () =>
        validator.validateModuleEnabledState(
          disabledModules,
          targetModule!.moduleId,
          false,
        ),
      );
      const disabledModule = RolePermissionMapper.findModuleById(
        disabledModules,
        targetModule!.moduleId,
      );
      validation.execute("Disable revokes all module permissions", () =>
        validator.validateModuleToggleRevokesAllPermissions(disabledModule!),
      );
      const enableResponse = await roleApi.setRoleModuleEnabled(
        roleId,
        targetModule!.moduleId,
        RolePermissionData.reenableModulePayload,
      );
      validation.execute("Re-enable module status", () =>
        assert.validateStatusCode(
          enableResponse.rawResponse,
          200,
          enableResponse.responseBody,
        ),
      );
      const afterEnable = await roleApi.getRolePermissions(roleId);
      const enabledModules = RolePermissionMapper.mapRolePermissions(
        afterEnable.responseBody,
      ).modules;
      validation.execute("Module re-enabled in catalog", () =>
        validator.validateModuleEnabledState(
          enabledModules,
          targetModule!.moduleId,
          true,
        ),
      );
      const enabledModule = RolePermissionMapper.findModuleById(
        enabledModules,
        targetModule!.moduleId,
      );
      validation.execute("Enable grants all module permissions", () =>
        validator.validateModuleToggleGrantsAllPermissions(enabledModule!),
      );

      await roleApi.deleteRole(roleId);
      validation.printSummary(
        "Set Role Module Enabled",
        created.responseTime +
          disableResponse.responseTime +
          enableResponse.responseTime,
      );
    },
  );

  test(
    "PUT /roles/:roleId/permissions — dependency rules expand required keys",
    { tag: ["@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const rulesResponse = await roleApi.getDependencyRules();
      validation.execute("Dependency rules status", () =>
        assert.validateStatusCode(rulesResponse.rawResponse, 200),
      );
      validator.validateDependencyRulesResponse(rulesResponse.responseBody);

      const requires = rulesResponse.responseBody.data.requires as Record<
        string,
        string[]
      >;

      const payload = RolePermissionData.buildUniqueRolePayload();
      const created = await roleApi.createRole(payload);
      const roleId = RolePermissionMapper.mapRole(created.responseBody).id;

      const catalog = await roleApi.getRolePermissions(roleId);
      const modules = RolePermissionMapper.mapRolePermissions(
        catalog.responseBody,
      ).modules;
      const assignCase = RolePermissionMapper.pickDependencyAssignCase(
        requires,
        modules,
      );

      if (!assignCase) {
        await roleApi.deleteRole(roleId);
        test.skip(true, "No dependency assign case found in catalog");
      }

      const assignResponse = await roleApi.assignPermissions(roleId, {
        permissionKeys: [assignCase!.permissionKey],
      });
      validation.execute("Assign child permission status", () =>
        assert.validateStatusCode(
          assignResponse.rawResponse,
          200,
          assignResponse.responseBody,
        ),
      );

      const verifyResponse = await roleApi.getRolePermissions(roleId);
      const grantedKeys = RolePermissionMapper.collectGrantedKeys(
        RolePermissionMapper.mapRolePermissions(verifyResponse.responseBody)
          .modules,
      );

      validation.execute("Required dependency keys expanded", () =>
        validator.validateExpandedDependencies(
          grantedKeys,
          assignCase!.permissionKey,
          assignCase!.requiredKeys,
        ),
      );

      await roleApi.deleteRole(roleId);

      validation.printSummary(
        "Assign Permission Dependency Expansion",
        rulesResponse.responseTime + assignResponse.responseTime,
      );
    },
  );
  test(
    "PUT /roles/:roleId/permissions — replace semantics (full replace + empty revoke)",
    { tag: ["@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);
      const payload = RolePermissionData.buildUniqueRolePayload();

      const created = await roleApi.createRole(payload);
      validation.execute("Create role for replace test", () =>
        assert.validateStatusCode(created.rawResponse, 201, created.responseBody),
      );

      const roleId = RolePermissionMapper.mapRole(created.responseBody).id;
      const rulesResponse = await roleApi.getDependencyRules();
      const requires = (rulesResponse.responseBody.data?.requires ??
        {}) as Record<string, string[]>;

      const catalog = await roleApi.getRolePermissions(roleId);
      const modules = RolePermissionMapper.mapRolePermissions(
        catalog.responseBody,
      ).modules;
      const replaceCase = RolePermissionMapper.pickReplacePermissionKeys(
        modules,
        requires,
      );
      if (!replaceCase) {
        await roleApi.deleteRole(roleId);
        test.skip(true, "Need two modules with distinct permission keys");
      }
      const firstAssign = await roleApi.assignPermissions(roleId, {
        permissionKeys: replaceCase!.firstKeys,
      });
      validation.execute("First assign status", () =>
        assert.validateStatusCode(
          firstAssign.rawResponse,
          200,
          firstAssign.responseBody,
        ),
      );
      const afterFirst = await roleApi.getRolePermissions(roleId);
      const modulesAfterFirst = RolePermissionMapper.mapRolePermissions(
        afterFirst.responseBody,
      ).modules;
      validation.execute("First keys granted", () =>
        validator.validateAssignedPermissions(
          modulesAfterFirst,
          replaceCase!.firstKeys,
        ),
      );
      const secondAssign = await roleApi.assignPermissions(roleId, {
        permissionKeys: replaceCase!.secondKeys,
      });
      validation.execute("Second assign status", () =>
        assert.validateStatusCode(
          secondAssign.rawResponse,
          200,
          secondAssign.responseBody,
        ),
      );
      const afterSecond = await roleApi.getRolePermissions(roleId);
      const modulesAfterSecond = RolePermissionMapper.mapRolePermissions(
        afterSecond.responseBody,
      ).modules;
      validation.execute("Second assign replaces first key", () => {
        validator.validateAssignedPermissions(
          modulesAfterSecond,
          replaceCase!.secondKeys,
        );
        validator.validateKeyNotGranted(
          modulesAfterSecond,
          replaceCase!.firstKeys[0],
        );
      });
      const revokeAll = await roleApi.assignPermissions(
        roleId,
        RolePermissionData.emptyPermissionKeys,
      );
      validation.execute("Empty assign status", () =>
        assert.validateStatusCode(revokeAll.rawResponse,200,revokeAll.responseBody,),
      );
      const afterRevoke = await roleApi.getRolePermissions(roleId);
      validation.execute("Empty array revokes all permissions", () =>
        validator.validateNoGrantedPermissions(
          RolePermissionMapper.mapRolePermissions(afterRevoke.responseBody)
            .modules,
        ),
      );
      await roleApi.deleteRole(roleId);
      validation.printSummary("Assign Permissions Replace Semantics",firstAssign.responseTime + secondAssign.responseTime,);
    },
  );
});
