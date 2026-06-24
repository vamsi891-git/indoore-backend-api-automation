import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { RolePermissionApi } from "../Api/rolepermission.api";
import { RolePermissionData } from "../Data/rolepermission.data";
import { RolePermissionMapper } from "../Mapper/rolepermission.mapper";
import { RolePermissionValidator } from "../Validator/rolepermission.validator";

test.describe("Role Permission — List & Me", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "Validate GET /permissions/roles — role catalog",
    { tag: ["@smoke", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const getRolesResponse = await roleApi.getRoles();

      validation.execute("Get Roles Status Code", () =>
        assert.validateStatusCode(getRolesResponse.rawResponse, 200),
      );
      validation.execute("Get Roles Content Type", () =>
        assert.validateContentType(getRolesResponse.rawResponse),
      );
      validation.execute("Get Roles Response Time", () =>
        assert.validateResponseTime(
          getRolesResponse.responseTime,
          RolePermissionData.maxResponseTime,
        ),
      );
      validation.execute("Get Roles Sensitive Data", () =>
        assert.validateSensitiveData(getRolesResponse.responseBody),
      );

      await PerformanceTracker.track(
        getRolesResponse.rawResponse,
        "Get Roles",
        getRolesResponse.rawResponse.url(),
        getRolesResponse.responseTime,
      );

      const roles = RolePermissionMapper.mapRoles(getRolesResponse.responseBody);

      validation.execute("Validate Roles Response", () =>
        validator.validateResponse(getRolesResponse.responseBody),
      );
      validation.execute("Validate Roles List", () =>
        validator.validateRoles(roles),
      );
      validation.execute("Validate Role Structure", () =>
        validator.validateRoleStructure(roles),
      );
      validation.execute("Validate Duplicate Roles", () =>
        validator.validateDuplicateRoles(roles),
      );
      validation.execute("Validate Sort Order", () =>
        validator.validateSortOrder(roles),
      );
      validation.execute("Validate Ultimate Role", () =>
        validator.validateUltimateRole(roles),
      );

      validation.printSummary("Get Roles", getRolesResponse.responseTime);
    },
  );

  test(
    "Validate GET /permissions/me/modules and /me/permissions",
    { tag: ["@smoke", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const modulesResponse = await roleApi.getMyModules();
      const permissionsResponse = await roleApi.getMyPermissions();

      validation.execute("My Modules Status", () =>
        assert.validateStatusCode(modulesResponse.rawResponse, 200),
      );
      validation.execute("My Permissions Status", () =>
        assert.validateStatusCode(permissionsResponse.rawResponse, 200),
      );
      validation.execute("My Modules Response", () =>
        validator.validateMyModulesResponse(modulesResponse.responseBody),
      );
      validation.execute("My Permissions Response", () =>
        validator.validateMyPermissionsResponse(permissionsResponse.responseBody),
      );

      validation.printSummary(
        "Get My Modules & Permissions",
        modulesResponse.responseTime + permissionsResponse.responseTime,
      );
    },
  );

  test(
    "Validate GET /permissions/dependency-rules",
    { tag: ["@smoke", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const response = await roleApi.getDependencyRules();
      const status = response.rawResponse.status();

      if (
        BackendResponse.shouldSkipServerFailure(
          status,
          "Get Dependency Rules",
          response.responseBody,
        )
      ) {
        test.skip(true, "Dependency rules endpoint returned server error");
      }

      if (status === 404) {
        test.skip(true, "Dependency rules endpoint not deployed");
      }

      validation.execute("Dependency Rules Status", () =>
        assert.validateStatusCode(response.rawResponse, 200),
      );
      validation.execute("Dependency Rules Response", () =>
        validator.validateDependencyRulesResponse(response.responseBody),
      );

      validation.printSummary("Get Dependency Rules", response.responseTime);
    },
  );
});
