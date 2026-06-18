// tests/organisationsearch.spec.ts

import { test } from "../../../../src/fixtures/api.fixture";
import { OrganizationApi } from "../Api/searchorganization.api";
import { OrganizationMapper } from "../Mapper/searchorganization.mapper";
import { OrganizationValidator } from "../Validator/searchorganization.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Organization Search API", () => {
  test("Validate Organization Search",
    {
      tag: ["@smoke", "@organization"],
    },
    async ({ authenticatedApi }) => {
      const api = new OrganizationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.searchOrganizations(20);
        await PerformanceTracker.track(
          rawResponse,
          "Organization Search API",
          `${process.env.BASE_URL}/indore/utils/search/organizations?limit=20`,
          responseTime
        );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute("Content Validation", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, 60000),
      );
      validation.execute("Security Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      const data = OrganizationMapper.mapData(responseBody.data);
      const validator = new OrganizationValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Duplicate IDs", () =>
        validator.validateDuplicateIds(data),
      );
      validation.execute("Backend Rules", () =>
        validator.validateBackendRules(data),
      );
      validation.execute("Code Validation", () =>
        validator.validateCodeFormat(data),
      );
      validation.printSummary("Organization Search API", responseTime);
    },
  );
});
