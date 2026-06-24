import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { RolePermissionApi } from "../Api/rolepermission.api";
import { RolePermissionData } from "../Data/rolepermission.data";
import { RolePermissionMapper } from "../Mapper/rolepermission.mapper";
import { RolePermissionValidator } from "../Validator/rolepermission.validator";

test.describe("Role Permission — Negative", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "POST /permissions/roles — invalid role name (uppercase) returns 400",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await roleApi.createRole(RolePermissionData.invalidRoleNameUppercase);

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      validation.printSummary("Create Role — Invalid Name", responseTime);
    },
  );

  test(
    "POST /permissions/roles — role name too short returns 400",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await roleApi.createRole(RolePermissionData.invalidRoleNameShort);

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      validation.printSummary("Create Role — Short Name", responseTime);
    },
  );

  test(
    "POST /permissions/roles — duplicate role name returns 409 or 400",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);
      const payload = RolePermissionData.buildUniqueRolePayload();

      const first = await roleApi.createRole(payload);
      validation.execute("First create succeeds", () =>
        assert.validateStatusCode(first.rawResponse, 201, first.responseBody),
      );

      const duplicate = await roleApi.createRole(payload);
      validation.execute("Duplicate name rejected", () =>
        validator.validateErrorResponse(
          duplicate.rawResponse.status(),
          duplicate.responseBody,
          [400, 409],
        ),
      );

      const created = RolePermissionMapper.mapRole(first.responseBody);
      await roleApi.deleteRole(created.id);

      validation.printSummary(
        "Create Role — Duplicate Name",
        first.responseTime + duplicate.responseTime,
      );
    },
  );

  test(
    "PATCH /permissions/roles/:id — empty body returns 400",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);
      const payload = RolePermissionData.buildUniqueRolePayload();

      const created = await roleApi.createRole(payload);
      const roleId = RolePermissionMapper.mapRole(created.responseBody).id;

      const { rawResponse, responseBody, responseTime } =
        await roleApi.updateRole(roleId, {});

      validation.execute("Status (empty patch)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      await roleApi.deleteRole(roleId);

      validation.printSummary("Update Role — Empty Body", responseTime);
    },
  );

  test(
    "PATCH /permissions/roles/:id — unknown role returns 404",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await roleApi.updateRole(RolePermissionData.unknownResourceId, {
          description: "Missing role",
        });

      validation.execute("Status (not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Update Role — Not Found", responseTime);
    },
  );

  test(
    "PUT /permissions/roles/:id/permissions — unknown permission keys returns 400",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);
      const payload = RolePermissionData.buildUniqueRolePayload();

      const created = await roleApi.createRole(payload);
      const roleId = RolePermissionMapper.mapRole(created.responseBody).id;

      const { rawResponse, responseBody, responseTime } =
        await roleApi.assignPermissions(
          roleId,
          RolePermissionData.unknownPermissionKeys,
        );

      validation.execute("Status (unknown keys)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      await roleApi.deleteRole(roleId);

      validation.printSummary("Assign Permissions — Unknown Keys", responseTime);
    },
  );

  test(
    "DELETE /permissions/roles/:id — protected role returns 403",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const list = await roleApi.getRoles();
      const roles = RolePermissionMapper.mapRoles(list.responseBody);
      const protectedRole = roles.find((role) =>
        validator.isProtectedRoleName(role.name),
      );

      if (!protectedRole) {
        test.skip(true, "No protected role found in catalog");
      }

      const { rawResponse, responseBody, responseTime } =
        await roleApi.deleteRole(protectedRole!.id);
      const status = rawResponse.status();

      if (
        BackendResponse.shouldSkipServerFailure(
          status,
          "Delete Protected Role",
          responseBody,
        )
      ) {
        validation.execute("Server error envelope", () =>
          validator.validateErrorResponse(status, responseBody, [500]),
        );
        validation.printSummary("Delete Protected Role — Server Error", responseTime);
        return;
      }

      validation.execute("Status (protected role)", () =>
        assert.validateStatusCode(rawResponse, 403, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(status, responseBody, [403], "PROTECTED_ROLE"),
      );

      validation.printSummary("Delete Protected Role", responseTime);
    },
  );

  test(
    "DELETE /permissions/roles/:id — unknown role returns 404",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await roleApi.deleteRole(RolePermissionData.unknownResourceId);

      validation.execute("Status (role not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Delete Role — Not Found", responseTime);
    },
  );

  test(
    "PUT /roles/:roleId/modules/:moduleId — unknown role returns 404",
    { tag: ["@negative", "@permissions", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new RolePermissionValidator();
      const roleApi = new RolePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await roleApi.setRoleModuleEnabled(
          RolePermissionData.unknownResourceId,
          1,
          RolePermissionData.setModuleEnabledPayload,
        );

      validation.execute("Status (role not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Set Role Module — Role Not Found", responseTime);
    },
  );
});
