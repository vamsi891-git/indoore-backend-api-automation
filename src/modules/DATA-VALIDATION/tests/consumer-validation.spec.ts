import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { ConsumerValidationApi } from "../Api/consumer-validation.api";
import {
  consumerValidationMaxResponseTimeMs,
  consumerValidationTestCases,
} from "../Data/consumer-validation.data";
import { ConsumerValidationMapper } from "../Mapper/consumer-validation.mapper";
import { ConsumerValidationValidator } from "../Validator/consumer-validation.validator";

test.describe("Data Validation — Consumer Validation", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  for (const testCase of consumerValidationTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new ConsumerValidationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getConsumerValidation(
        testCase.query,
      );

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      if (testCase.expectedStatus !== 200) {
        validation.execute("Error Status", () => {
          ConsumerValidationValidator.validateErrorResponse(rawResponse.status(), responseBody, [
            testCase.expectedStatus,
            422,
          ]);
        });
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200, responseBody));
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, consumerValidationMaxResponseTimeMs),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      const data = ConsumerValidationMapper.mapData(responseBody.data);
      const validator = new ConsumerValidationValidator();

      validation.execute("Response Contract", () => validator.validateResponse(responseBody));
      validation.execute("Columns", () => validator.validateColumns(data));
      validation.execute("Pagination", () => validator.validatePagination(data, testCase.query));

      if (testCase.expectEmptyRows) {
        validation.execute("Empty Rows", () => validator.validateEmptyRows(data));
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      if (testCase.query.limit === 1) {
        validation.execute("Limit One", () => validator.validateLimitOne(data));
      }

      if (testCase.nonEmptyExpected) {
        validation.execute("Non-Empty", () => {
          expect(
            data.rows.length,
            "Smoke: consumer-validation rows must be non-empty",
          ).toBeGreaterThan(0);
        });
        validation.execute("Rows Exist", () => validator.validateRowsExist(data));
      }

      if (data.rows.length > 0) {
        validation.execute("Required Fields", () => validator.validateRequiredFields(data));
        validation.execute("Data Types", () => validator.validateDataTypes(data));
        validation.execute("No Duplicate Rows", () => validator.validateNoDuplicateRows(data.rows));
      }

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
