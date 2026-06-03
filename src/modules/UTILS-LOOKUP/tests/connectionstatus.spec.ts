// tests/connectionstatus.spec.ts

import { test } from "../../../../src/fixtures/api.fixture";
import { ConnectionStatusApi } from "../Api/connectionstatus.api";
import { ConnectionStatusMapper } from "../Mapper/connectionstatus.mapper";
import { ConnectionStatusValidator } from "../Validator/connectionstatus.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Connection Status API", () => {
  test(
    "Validate Connection Status API",
    {
      tag: ["@smoke", "@connection"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConnectionStatusApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getConnectionStatuses();
      await PerformanceTracker.track(
        rawResponse,
        "Connection Status API",
        `${process.env.BASE_URL}/indore/utils/connection-statuses`,
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
      const data = ConnectionStatusMapper.mapData(responseBody.data);
      const validator = new ConnectionStatusValidator();
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
      validation.execute("Ascending Order", () =>
        validator.validateAscendingOrder(data),
      );
      validation.execute("Expected Values", () =>
        validator.validateExpectedValues(data),
      );
      validation.printSummary("Connection Status API", responseTime);
    },
  );
});
