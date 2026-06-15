// Tests/feeder-master.spec.ts

import { test } from "../../../../src/fixtures/api.fixture";
import { FeederMasterApi } from "../Api/feeder-master.api";
import { FeederMasterMapper } from "../Mapper/feeder-master.mapper";
import { FeederMasterValidator } from "../Validator/feeder-master.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Feeder Master API", () => {
  test(
    "Validate Feeder Master API",
    {
      tag: ["@smoke", "@feeder"],
    },
    async ({ authenticatedApi }) => {
      const api = new FeederMasterApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getFeederMasterData();
        await PerformanceTracker.track(
          rawResponse,
          "Feeder Master API",
          `${process.env.BASE_URL}/indore/master-data/feeder-master-data?page=1&limit=20`,
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
      const data = FeederMasterMapper.mapData(responseBody.data);
      const validator = new FeederMasterValidator();
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

      validation.printSummary("Feeder Master API", responseTime);
    },
  );
});
