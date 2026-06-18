// tests/eventclassification.spec.ts
import { test } from "../../../../src/fixtures/api.fixture";
import { EventClassificationApi } from "../Api/eventclassification.api";
import { EventClassificationMapper } from "../Mapper/eventclassification.mapper";
import { EventClassificationValidator } from "../Validator/eventclassification.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Event Classification API", () => {
  test("Validate Event Classification API",
    {
      tag: ["@smoke", "@eventclassification"],
    },
    async ({ authenticatedApi }) => {
      const api = new EventClassificationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getEventClassifications();
        await PerformanceTracker.track(
          rawResponse,
          "Event Classification API",
          `${process.env.BASE_URL}/indore/utils/event-classifications"`,
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
      const data = EventClassificationMapper.mapData(responseBody.data);
      const validator = new EventClassificationValidator();
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
      validation.execute("Expected Values", () =>
        validator.validateExpectedValues(data),
      );
      validation.printSummary("Event Classification API", responseTime);
    },
  );
});
