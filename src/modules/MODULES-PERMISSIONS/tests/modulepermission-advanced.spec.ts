import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ModulePermissionApi } from "../Api/modulepermission.api";
import { ModulePermissionData } from "../Data/modulepermission.data";
import { ModulePermissionMapper } from "../Mapper/modulepermission.mapper";
import { ModulePermissionValidator } from "../Validator/modulepermission.validator";

test.describe("Module Permission — Advanced", () => {
  test.describe.configure({ mode: "serial" });
  test("PATCH /permissions/modules/:id — isEnabled false then true",
    { tag: ["@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);
      const payload = ModulePermissionData.buildUniqueModulePayload();
      const created = await moduleApi.createModule(payload);
      if (created.rawResponse.status() === 429) {
        test.skip(true, "Rate limited — retry isEnabled test later");
      }
      validation.execute("Create module", () =>
        assert.validateStatusCode(created.rawResponse, 201, created.responseBody),
      );
      const moduleId = ModulePermissionMapper.mapModule(created.responseBody).id;
      const disableResponse = await moduleApi.updateModule(
        moduleId,
        ModulePermissionData.disableModulePayload,
      );
      validation.execute("Disable module status", () =>
        assert.validateStatusCode(
          disableResponse.rawResponse,
          200,
          disableResponse.responseBody,
        ),
      );
      const disabledModule = ModulePermissionMapper.mapModule(
        disableResponse.responseBody,
      );
      validation.execute("Disabled module response", () =>
        validator.validateUpdatedModule(
          disabledModule,
          ModulePermissionData.disableModulePayload,
        ),
      );
      const listAfterDisable = await moduleApi.getModules();
      const modulesAfterDisable = ModulePermissionMapper.mapModules(
        listAfterDisable.responseBody,
      );
      const moduleInList = modulesAfterDisable.find(
        (entry) => entry.id === moduleId,
      );
      validation.execute("Module isEnabled false in list", () => {
        expect(moduleInList?.isEnabled).toBe(false);
      });
      const enableResponse = await moduleApi.updateModule(moduleId, {
        isEnabled: true,
      });
      validation.execute("Re-enable module status", () =>
        assert.validateStatusCode(enableResponse.rawResponse, 200),
      );
      const listAfterEnable = await moduleApi.getModules();
      const moduleAfterEnable = ModulePermissionMapper.mapModules(
        listAfterEnable.responseBody,
      ).find((entry) => entry.id === moduleId);
      validation.execute("Module isEnabled true in list", () => {
        expect(moduleAfterEnable?.isEnabled).toBe(true);
      });
      await moduleApi.deleteModule(moduleId);
      validation.printSummary("Module isEnabled Toggle",created.responseTime + disableResponse.responseTime,);
    },
  );
});
