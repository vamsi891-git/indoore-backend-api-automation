import { test } from "../../../../src/fixtures/api.fixture";
import { EventReportApi } from "../Api/eventreport.api";
import { mapEventReportResponse } from "../Mapper/eventreport.mapper";
import { EventReportValidator } from "../Validator/eventreport.validator";
import { eventReportData } from "../Data/eventreport.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("Event Report API", () => {
  test.setTimeout(120000);
  test(
    "Validate Event Report Aggregation",
    {
      tag: ["@smoke", "@event-report"],
    },
    async ({ authenticatedApi }) => {
      // ============================
      // API
      // ============================
      const api = new EventReportApi(authenticatedApi);
      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.getEventReport(eventReportData);
      // ============================
      // Engines
      // ============================
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      // ============================
      // Assertion Validations
      // ============================
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
      // ============================
      // Mapper
      // ============================
      const mappedResponse = mapEventReportResponse(responseBody);
      // ============================
      // Validator
      // ============================
      const validator = new EventReportValidator();
      validation.execute(
        "Response Validation",
        () => validator.validateResponse(responseBody),
      );
      validation.execute(
        "No Empty Items Validation",
        () => validator.validateNoEmptyItems(mappedResponse),
      );

      validation.execute(
        "Mandatory Fields Validation",
        () => validator.validateMandatoryFields(mappedResponse),
      );
      validation.execute(
        "Meter vs Event Count Validation",
        () => validator.validateMetervsEventCount(mappedResponse),
      );
      validation.execute(
        "Scoped Meter Count Validation",
        () => validator.validateScopedMeterCount(responseBody),
      );
      validation.execute(
        "Event ID Name Consistency Validation",
        () => validator.validateEventIdNameConsistency(mappedResponse),
      );
      validation.execute(
        "Duration Format Validation",
        () => validator.validateDurationFormat(mappedResponse),
      );
      validation.execute(
        "Positive Duration Validation",
        () => validator.validatePositiveDuration(mappedResponse),
      );

      validation.execute(
        "Unique Grouping Validation",

        () => validator.validateUniqueGrouping(mappedResponse),
      );
      validation.execute(
        "Sequential SLNO Validation",
        () => validator.validateSequentialSLNo(mappedResponse),
      );
      validation.execute(
        "Duplicate SLNO Validation",
        () => validator.validateDuplicateSlNo(mappedResponse),
      );
      // ============================
      // FINAL SUMMARY
      // ============================
      validation.printSummary(
        "Event Report API",
        responseTime,
      );
    },
  );
});
