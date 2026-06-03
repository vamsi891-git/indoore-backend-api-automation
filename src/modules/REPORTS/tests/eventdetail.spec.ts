import { test } from "../../../../src/fixtures/api.fixture";
import { EventDetailApi } from "../Api/eventdetail";
import { mapEventDetailResponse } from "../Mapper/eventdetail.mapper";
import { EventDetailValidator } from "../Validator/eventdetail.validator";
import { eventDetailData } from "../Data/eventdetail.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("Event Detail API", () => {
  test.setTimeout(120000);
  test(
    "Validate Event Detail Report",
    {
      tag: ["@smoke", "@event-detail"],
    },
    async ({ authenticatedApi }) => {
      // =========================
      // API
      // =========================
      const api = new EventDetailApi(authenticatedApi);
      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.getEventDetail(eventDetailData);
      // =========================
      // Engines
      // =========================
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      // =========================
      // Assertion Validations
      // =========================
      validation.execute(
        "Status Code Validation",
        () => assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute(
        "Content Type Validation",
        () => assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute(
        "Response Time Validation",
        () => assert.validateResponseTime(responseTime, 120000),
      );
      validation.execute(
        "Sensitive Data Validation",
        () => assert.validateSensitiveData(responseBody),
      );
      // =========================
      // Mapper
      // =========================
      const rows = mapEventDetailResponse(responseBody);
      // =========================
      // Validator
      // =========================
      const validator = new EventDetailValidator();
      validation.execute(
        "Response Validation",
        () => validator.validateResponse(responseBody),
      );
      validation.execute(
        "Mandatory Fields Validation",
        () => validator.validateMandatoryFields(rows),
      );
      validation.execute(
        "Event Count Validation",
        () => validator.validateEventCount(rows),
      );
      validation.execute(
        "Duration Format Validation",
        () => validator.validateDurationFormat(rows),
      );
      validation.execute(
        "Unique SLNO Validation",
        () => validator.ValidateUniqueSLNo(rows),
      );
      validation.execute(
        "Sequential SLNO Validation",
        () => validator.validateSequentialSLNo(rows),
      );
      validation.execute(
        "Total Row Count Validation",
        () => validator.validateTotalRowCount(responseBody),
      );
      validation.execute(
        "Scoped Meter Count Validation",
        () => validator.validateScopedMeterCount(responseBody),
      );
      validation.execute(
        "Event Classification Validation",
        () => validator.validateEventClassificationName(rows),
      );
      validation.execute(
        "Duplicate Consumer Event Validation",
        () => validator.validateNoDuplicateConsumerEvents(rows),
      );
      // =========================
      // FINAL SUMMARY
      // =========================
      validation.printSummary(
        "Event Detail API",
        responseTime,
      );
    },
  );
});
