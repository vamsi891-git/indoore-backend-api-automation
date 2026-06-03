import { test } from "../../../../src/fixtures/api.fixture";
import { OrganisationApi } from "../Api/organizationhierarchy.api";
import { OrganisationMapper } from "../Mapper/organizationhierarchy.mapper";
import { OrganisationValidator } from "../Validator/organizationhierarchy.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Organisation Hierarchy API", () => {
  test(
    "Validate Organisation Hierarchy",
    {
      tag: ["@smoke", "@organisation"],
    },
    async ({ authenticatedApi }) => {
      const api = new OrganisationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getOrganisationHierarchy();
        await PerformanceTracker.track(
          rawResponse,
          "Organisation Hierarchy API",
          `${process.env.BASE_URL}/indore/utils/hierarchies/organization`,
          responseTime
        );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, 60000),
      );
      validation.execute("Security", () =>
        assert.validateSensitiveData(responseBody),
      );
      const data = OrganisationMapper.mapData(responseBody.data);
      const validator = new OrganisationValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Duplicates", () =>
        validator.validateDuplicateCodes(data),
      );
      validation.execute("Order", () => validator.validateOrderSequence(data));
      validation.execute("Hierarchy Validation", () =>
        validator.validateExpectedHierarchy(data),
      );
      validation.printSummary("Organisation Hierarchy API", responseTime);
    },
  );
});
