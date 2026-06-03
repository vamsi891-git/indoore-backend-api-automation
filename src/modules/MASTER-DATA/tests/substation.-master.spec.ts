// Tests/substation-master.spec.ts

import { test } from "../../../../src/fixtures/api.fixture";
import { SubstationMasterApi } from "../Api/substation-master.api";
import { SubstationMasterMapper } from "../Mapper/substation-master.mapper";
import { SubstationMasterValidator } from "../Validator/substation-master.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Substation Master API", () => {
  test(
    "Validate Substation Master API",
    {
      tag: ["@smoke", "@substation"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubstationMasterApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getSubstationMasterData();
        await PerformanceTracker.track(
          rawResponse,
          "Substation Master API",
          `${process.env.BASE_URL}/indore/master-data/substation-master-data?page=1&limit=20`,
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
      const data = SubstationMasterMapper.mapData(responseBody.data);
      const validator = new SubstationMasterValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Pagination", () =>
        validator.validatePagination(data),
      );
      validation.execute("Hierarchy", () =>
        validator.validateHierarchyFields(data),
      );
      validation.execute("Counts", () => validator.validateCounts(data));
      validation.execute("Serial Numbers", () =>
        validator.validateSerialNumbers(data),
      );
      validation.execute("Consumer DTR Relation", () =>
        validator.validateConsumerDtrRelation(data),
      );
      validation.printSummary("Substation Master API", responseTime);
    },
  );
});
