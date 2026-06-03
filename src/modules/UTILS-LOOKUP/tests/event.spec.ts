// tests/event.spec.ts

import { test } from "../../../../src/fixtures/api.fixture";
import { EventApi } from "../Api/eventapi";
import { EventMapper } from "../Mapper/event.mapper";
import { EventValidator } from "../Validator/event.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Event API", () => {
  test(
    "Validate Event API",
    {
      tag: ["@smoke", "@events"],
    },
    async ({ authenticatedApi }) => {
      const api = new EventApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getEvents();
      await PerformanceTracker.track(
        rawResponse,
        "Event API",
        `${process.env.BASE_URL}/indore/utils/event`,
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
      const data = EventMapper.mapData(responseBody.data);
      const validator = new EventValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Event Names Validation", () =>
        validator.validateEventNames(data),
      );
      validation.execute("Duplicate IDs", () =>
        validator.validateDuplicateIds(data),
      );
      validation.execute("Reference Tables", () =>
        validator.validateReferenceTables(data),
      );
      validation.execute("Expected Events", () =>
        validator.validateKnownEvents(data),
      );
      validation.printSummary("Events API", responseTime);
    },
  );
});
