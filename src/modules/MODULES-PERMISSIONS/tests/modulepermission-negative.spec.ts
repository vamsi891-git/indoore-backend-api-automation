import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { ModulePermissionApi } from "../Api/modulepermission.api";
import { ModulePermissionData } from "../Data/modulepermission.data";
import { ModulePermissionMapper } from "../Mapper/modulepermission.mapper";
import { ModulePermissionValidator } from "../Validator/modulepermission.validator";

function skipIfRateLimited(status: number): void {
  if (BackendResponse.shouldSkipRateLimit(status, "Module Permission Negative")) {
    test.skip(true, "Rate limited (429) — retry later");
  }
}

test.describe("Module Permission — Negative", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "POST /permissions/modules — invalid module key returns 400",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.createModule(ModulePermissionData.invalidModuleKeyPayload);

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      validation.printSummary("Create Module — Invalid Key", responseTime);
    },
  );

  test(
    "POST /permissions/modules — invalid module name returns 400",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.createModule(ModulePermissionData.invalidModuleNamePayload);

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (validation error)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      validation.printSummary("Create Module — Invalid Name", responseTime);
    },
  );

  test(
    "POST /permissions/modules — duplicate module key returns 409 or 400",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);
      const payload = ModulePermissionData.buildUniqueModulePayload();

      const first = await moduleApi.createModule(payload);
      skipIfRateLimited(first.rawResponse.status());
      validation.execute("First create succeeds", () =>
        assert.validateStatusCode(first.rawResponse, 201, first.responseBody),
      );

      const duplicate = await moduleApi.createModule(payload);
      skipIfRateLimited(duplicate.rawResponse.status());
      validation.execute("Duplicate key rejected", () =>
        validator.validateErrorResponse(
          duplicate.rawResponse.status(),
          duplicate.responseBody,
          [400, 409],
        ),
      );

      const created = ModulePermissionMapper.mapModule(first.responseBody);
      await moduleApi.deleteModule(created.id);

      validation.printSummary(
        "Create Module — Duplicate Key",
        first.responseTime + duplicate.responseTime,
      );
    },
  );

  test(
    "PATCH /permissions/modules/:id — empty body returns 400",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);
      const payload = ModulePermissionData.buildUniqueModulePayload();

      const created = await moduleApi.createModule(payload);
      skipIfRateLimited(created.rawResponse.status());
      const moduleId = ModulePermissionMapper.mapModule(created.responseBody).id;

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.updateModule(moduleId, {});

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (empty patch)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      await moduleApi.deleteModule(moduleId);

      validation.printSummary("Update Module — Empty Body", responseTime);
    },
  );

  test(
    "PATCH /permissions/modules/:id — unknown module returns 404",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.updateModule(ModulePermissionData.unknownResourceId, {
          name: "Does Not Exist",
        });

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Update Module — Not Found", responseTime);
    },
  );

  test(
    "DELETE /permissions/modules/:id — protected module returns 403",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const list = await moduleApi.getModules();
      skipIfRateLimited(list.rawResponse.status());
      const modules = ModulePermissionMapper.mapModules(list.responseBody);
      const protectedModule = modules.find((m) =>
        ModulePermissionData.protectedModuleKeys.includes(
          m.key as (typeof ModulePermissionData.protectedModuleKeys)[number],
        ),
      );

      if (!protectedModule) {
        test.skip(true, "No protected module found in catalog");
      }

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.deleteModule(protectedModule!.id);
      const status = rawResponse.status();

      skipIfRateLimited(status);

      if (
        BackendResponse.shouldSkipServerFailure(
          status,
          "Delete Protected Module",
          responseBody,
        )
      ) {
        validation.execute("Server error envelope", () =>
          validator.validateErrorResponse(status, responseBody, [500]),
        );
        validation.printSummary("Delete Protected Module — Server Error", responseTime);
        return;
      }

      validation.execute("Status (protected resource)", () =>
        assert.validateStatusCode(rawResponse, 403, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(
          status,
          responseBody,
          [403],
          "PROTECTED_RESOURCE",
        ),
      );

      validation.printSummary("Delete Protected Module", responseTime);
    },
  );

  test(
    "POST /permissions/modules/:id/permissions — invalid key (no dot) returns 400",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);
      const payload = ModulePermissionData.buildUniqueModulePayload();

      const created = await moduleApi.createModule(payload);
      skipIfRateLimited(created.rawResponse.status());
      const moduleId = ModulePermissionMapper.mapModule(created.responseBody).id;

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.createPermission(
          moduleId,
          ModulePermissionData.invalidPermissionKeyNoDot,
        );

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (invalid permission key)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      await moduleApi.deleteModule(moduleId);

      validation.printSummary("Create Permission — Invalid Key", responseTime);
    },
  );

  test(
    "POST /permissions/modules/:id/permissions — key prefix mismatch returns 400",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);
      const payload = ModulePermissionData.buildUniqueModulePayload();

      const created = await moduleApi.createModule(payload);
      skipIfRateLimited(created.rawResponse.status());
      const createdModule = ModulePermissionMapper.mapModule(created.responseBody);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.createPermission(
          createdModule.id,
          ModulePermissionData.buildMismatchedPermissionPayload(createdModule.key),
        );

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (prefix mismatch)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [400]),
      );

      await moduleApi.deleteModule(createdModule.id);

      validation.printSummary("Create Permission — Prefix Mismatch", responseTime);
    },
  );

  test(
    "POST /permissions/modules/:id/permissions — unknown module returns 404",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.createPermission(
          ModulePermissionData.unknownResourceId,
          ModulePermissionData.buildPermissionPayload("missing_module", "view"),
        );

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (module not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Create Permission — Module Not Found", responseTime);
    },
  );

  test(
    "PATCH /permissions/permissions/:id — unknown permission returns 404",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.updatePermission(ModulePermissionData.unknownResourceId, {
          name: "Missing Permission",
        });

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (permission not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Update Permission — Not Found", responseTime);
    },
  );

  test(
    "POST /permissions/modules/:id/permissions — duplicate permission key returns 409 or 400",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);
      const modulePayload = ModulePermissionData.buildUniqueModulePayload();

      const createdModule = await moduleApi.createModule(modulePayload);
      skipIfRateLimited(createdModule.rawResponse.status());
      const moduleKey = ModulePermissionMapper.mapModule(
        createdModule.responseBody,
      ).key;
      const moduleId = ModulePermissionMapper.mapModule(
        createdModule.responseBody,
      ).id;
      const permissionPayload = ModulePermissionData.buildPermissionPayload(
        moduleKey,
        "view",
      );

      const first = await moduleApi.createPermission(moduleId, permissionPayload);
      skipIfRateLimited(first.rawResponse.status());
      validation.execute("First permission create succeeds", () =>
        assert.validateStatusCode(first.rawResponse, 201, first.responseBody),
      );

      const duplicate = await moduleApi.createPermission(
        moduleId,
        permissionPayload,
      );
      skipIfRateLimited(duplicate.rawResponse.status());
      validation.execute("Duplicate permission key rejected", () =>
        validator.validateErrorResponse(
          duplicate.rawResponse.status(),
          duplicate.responseBody,
          [400, 409],
        ),
      );

      const permissionId = ModulePermissionMapper.mapPermission(
        first.responseBody,
      ).id;
      await moduleApi.deletePermission(permissionId);
      await moduleApi.deleteModule(moduleId);

      validation.printSummary(
        "Create Permission — Duplicate Key",
        first.responseTime + duplicate.responseTime,
      );
    },
  );

  test(
    "DELETE /permissions/modules/:id — unknown module returns 404",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.deleteModule(ModulePermissionData.unknownResourceId);

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (module not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Delete Module — Not Found", responseTime);
    },
  );

  test(
    "DELETE /permissions/permissions/:id — unknown permission returns 404",
    { tag: ["@negative", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const { rawResponse, responseBody, responseTime } =
        await moduleApi.deletePermission(ModulePermissionData.unknownResourceId);

      skipIfRateLimited(rawResponse.status());

      validation.execute("Status (permission not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Error envelope", () =>
        validator.validateErrorResponse(rawResponse.status(), responseBody, [404]),
      );

      validation.printSummary("Delete Permission — Not Found", responseTime);
    },
  );
});
