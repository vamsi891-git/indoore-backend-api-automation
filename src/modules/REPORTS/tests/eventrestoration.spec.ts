import { test } from "../../../../src/fixtures/api.fixture";
import { EventRestorationApi } from "../Api/eventrestoration.api";
import { mapEventRestorationResponse } from "../Mapper/eventrestoration.mapper";
import { EventRestorationValidator } from "../Validator/eventrestoration.validator";
import { eventRestorationData } from "../Data/eventrestoration.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("Event Restoration API", () => {
  test.setTimeout(120000);
  test(
    "Validate Event Restoration Report",
    {
      tag: ["@smoke", "@event-restoration"],
    },
    async ({ authenticatedApi }) => {
      // =====================
      // API
      // =====================
      const api = new EventRestorationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getEventRestoration(eventRestorationData);
      // =====================
      // Engines
      // =====================
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      // =====================
      // Assertion Validations
      // =====================
      validation.execute("Status Code Validation", () =>
        assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute("Content Type Validation", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Response Time Validation", () =>
        assert.validateResponseTime(responseTime, 120000),
      );
      validation.execute("Sensitive Data Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      // =====================
      // Mapper
      // =====================
      const rows = mapEventRestorationResponse(responseBody);
      // =====================
      // Validator
      // =====================
      const validator = new EventRestorationValidator();
      validation.execute("Response Validation", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Mandatory Fields Validation", () =>
        validator.ValidateMandatoryFields(rows),
      );
      validation.execute("Sequential SLNO Validation", () =>
        validator.validateSequentialSLNo(rows),
      );
      validation.execute("Unique SLNO Validation", () =>
        validator.validateUniqueSLNO(rows),
      );
      validation.execute("Duplicate Event Validation", () =>
        validator.validateNoDuplicateEvents(rows),
      );
      validation.execute("Occurrence Time Validation", () =>
        validator.validateOccurenceTimeFormat(rows),
      );
      validation.execute("Scoped Meter Validation", () =>
        validator.validateScopedMeterCount(responseBody),
      );
      validation.execute("Truncated Flag Validation", () =>
        validator.validateTruncatedFlag(responseBody),
      );
      // =====================
      // FINAL SUMMARY
      // =====================
      validation.printSummary("Event Restoration API", responseTime);
    },
  );
});
