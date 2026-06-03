// tests/consumercategory.spec.ts
import { test } from "../../../../src/fixtures/api.fixture";
import { ConsumerCategoryApi } from "../Api/consumercategory.api";
import { ConsumerCategoryMapper } from "../Mapper/consumercategory.mapper";
import { ConsumerCategoryValidator } from "../Validator/consumercategory.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Consumer Category API", () => {
  test(
    "Validate Consumer Categories",
    {
      tag: ["@smoke", "@consumercategory"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerCategoryApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getConsumerCategories();
      await PerformanceTracker.track(
        rawResponse,
        "Consumer Category API",
        `${process.env.BASE_URL}/indore/utils/consumer-categories`,
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
      const data = ConsumerCategoryMapper.mapData(responseBody.data);
      const validator = new ConsumerCategoryValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Duplicate IDs", () =>
        validator.validateDuplicateIds(data),
      );
      validation.execute("Duplicate Names", () =>
        validator.validateDuplicateNames(data),
      );
      validation.execute("Duplicate Short Names", () =>
        validator.validateDuplicateShortNames(data),
      );
      validation.execute("Ascending Order", () =>
        validator.validateAscendingOrder(data),
      );
      validation.execute("Expected Categories", () =>
        validator.validateExpectedCategories(data),
      );
      validation.printSummary("Consumer Category API", responseTime);
    },
  );
});
