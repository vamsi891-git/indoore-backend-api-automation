// tests/eventpriority.spec.ts
import { test } from "../../../../src/fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority.api";
import { EventPriorityMapper } from "../Mapper/eventpriority.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Event Priority API", () => {
  test(
    "Validate Event Priority API",
    {
      tag: ["@smoke", "@eventpriority"],
    },
    async ({ authenticatedApi }) => {
      const api = new EventPriorityApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getEventPriorities();
        await PerformanceTracker.track(
          rawResponse,
          "Event Priority API",
          `${process.env.BASE_URL}/indore/utils/event-priorities"`,
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
      const data = EventPriorityMapper.mapData(responseBody.data);
      const validator = new EventPriorityValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Duplicate Validation", () =>
        validator.validateDuplicatePriorities(data),
      );
      validation.execute("Ascending Order", () =>
        validator.validateAscendingOrder(data),
      );
      validation.execute("Expected Values", () =>
        validator.validateExpectedValues(data),
      );
      validation.printSummary("Event Priority API", responseTime);
    },
  );
});
