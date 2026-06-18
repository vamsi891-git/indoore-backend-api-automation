// tests/meterphase.spec.ts

import { test } from "../../../../src/fixtures/api.fixture";
import { MeterPhaseApi } from "../Api/meterphase.api";
import { MeterPhaseMapper } from "../Mapper/meterphase.mapper";
import { MeterPhaseValidator } from "../Validator/meterphase.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Meter Phase API", () => {
  test("Validate Meter Phase API",
    {
      tag: ["@smoke", "@meterphase"],
    },
    async ({ authenticatedApi }) => {
      const api = new MeterPhaseApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getMeterPhases();
        await PerformanceTracker.track(
          rawResponse,
          "Meter Phase API",
          `${process.env.BASE_URL}/indore/utils/meter-phases`,
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
      const data = MeterPhaseMapper.mapData(responseBody.data);
      const validator = new MeterPhaseValidator();
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
        validator.validateExpectedPhases(data),
      );
      validation.printSummary("Meter Phase API", responseTime);
    },
  );
});
