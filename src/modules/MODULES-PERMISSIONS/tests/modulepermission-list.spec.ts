import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { ModulePermissionApi } from "../Api/modulepermission.api";
import { ModulePermissionData } from "../Data/modulepermission.data";
import { ModulePermissionMapper } from "../Mapper/modulepermission.mapper";
import { ModulePermissionValidator } from "../Validator/modulepermission.validator";

test.describe("Module Permission — List", () => {
  test.describe.configure({ mode: "serial" });

  test(
    "Validate GET /permissions/modules — catalog list",
    { tag: ["@smoke", "@permissions", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ModulePermissionValidator();
      const moduleApi = new ModulePermissionApi(authenticatedApi);

      const getModulesResponse = await moduleApi.getModules();

      validation.execute("Get Modules Status Code", () =>
        assert.validateStatusCode(getModulesResponse.rawResponse, 200),
      );
      validation.execute("Get Modules Content Type", () =>
        assert.validateContentType(getModulesResponse.rawResponse),
      );
      validation.execute("Get Modules Response Time", () =>
        assert.validateResponseTime(
          getModulesResponse.responseTime,
          ModulePermissionData.maxResponseTime,
        ),
      );
      validation.execute("Get Modules Sensitive Data", () =>
        assert.validateSensitiveData(getModulesResponse.responseBody),
      );

      await PerformanceTracker.track(
        getModulesResponse.rawResponse,
        "Get Modules",
        getModulesResponse.rawResponse.url(),
        getModulesResponse.responseTime,
      );

      const modules = ModulePermissionMapper.mapModules(
        getModulesResponse.responseBody,
      );

      validation.execute("Validate Root Response", () =>
        validator.validateResponse(getModulesResponse.responseBody),
      );
      validation.execute("Validate Modules Exist", () =>
        validator.validateModules(modules),
      );
      validation.execute("Validate Module Structure", () =>
        validator.validateModuleStructure(modules),
      );
      validation.execute("Validate Module Business Rules", () =>
        validator.validateModuleBusinessRules(modules),
      );
      validation.execute("Validate Duplicate Modules", () =>
        validator.validateDuplicateModules(modules),
      );
      validation.execute("Validate Module Sorting", () =>
        validator.validateModuleSorting(modules),
      );
      validation.execute("Validate Permission Structure", () =>
        validator.validatePermissionStructure(modules),
      );
      validation.execute("Validate Permission Business Rules", () =>
        validator.validatePermissionBusinessRules(modules),
      );
      validation.execute("Validate Duplicate Permissions", () =>
        validator.validateDuplicatePermissions(modules),
      );
      validation.execute("Validate Permission Sorting", () =>
        validator.validatePermissionSorting(modules),
      );
      validation.execute("Validate Parent Child Relation", () =>
        validator.validateParentChildRelation(modules),
      );
      validation.execute("Validate Permission Pattern", () =>
        validator.validatePermissionKeyPattern(modules),
      );
      validation.execute("Validate Permission Key Matches Module", () => {
        for (const module of modules) {
          for (const permission of module.permissions) {
            validator.validatePermissionKeyMatchesModule(
              module.key,
              permission.key,
            );
          }
        }
      });
      validation.execute("Validate Null Values", () =>
        validator.validateNullValues(modules),
      );
      validation.execute("Validate NaN Values", () =>
        validator.validateNaNValues(modules),
      );

      validation.printSummary("Get Modules", getModulesResponse.responseTime);
    },
  );
});
