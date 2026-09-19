import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsCategoryWiseApi } from "../Api/alarms-events-category-wise.api";
import {
  alarmsEventsCategoryWiseData,
  alarmsEventsCategoryWiseTestCases,
} from "../Data/alarms-events-category-wise.data";
import { AlarmsEventsCategoryWiseMapper } from "../Mappper/alarms-events-category-wise.mapper";
import { AlarmsEventsCategoryWiseValidator } from "../Validator/alarms-events-category-wise.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Alarms and Events - category-wise", () => {
  test.setTimeout(180_000);

  for (const testCase of alarmsEventsCategoryWiseTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AlarmsEventsCategoryWiseApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getCategoryWise(testCase.params);
      const assert = new AssertionEngine();
      const validate = new ValidationEngine();
      const validator = new AlarmsEventsCategoryWiseValidator();

      validate.execute("Status", () =>
        assert.validateStatusCode(
          rawResponse,
          testCase.expectedStatus,
          responseBody,
        ),
      );
      validate.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validate.execute("Response Time", () =>
        assert.validateResponseTime(
          responseTime,
          alarmsEventsCategoryWiseData.maxResponseTime,
        ),
      );
      validate.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );

      if (testCase.expectedStatus !== 200) {
        validate.execute("Error", () =>
          validator.validateValidationError(responseBody),
        );
        validate.printSummary(testCase.testName, responseTime);
        return;
      }

      const data = AlarmsEventsCategoryWiseMapper.map(responseBody);
      validate.execute("Zod schema", () =>
        validator.validateResponse(responseBody),
      );
      validate.execute("Dates", () =>
        validator.validateDates(data, testCase.expectedCurrentDate),
      );
      validate.execute("Columns", () => validator.validateColumns(data));
      validate.execute("Expected categories", () =>
        validator.validateExpectedCategories(data),
      );
      validate.execute("No duplicate categories", () =>
        validator.validateUniqueCategories(data),
      );
      validate.execute("Totals", () => validator.validateTotals(data));
      validate.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Alarms and Events category-wise - no login", () => {
  authTest(
    "GET /alarms-events/category-wise - missing token is rejected",
    {
      tag: [
        "@alarms-events",
        "@alarms-events-category-wise",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(
        alarmsEventsCategoryWiseData.path,
      );
      const responseTime = Date.now() - startedAt;
      const responseBody = await rawResponse.json().catch(() => ({}));
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.printSummary(
        "GET /alarms-events/category-wise - missing token is rejected",
        responseTime,
      );
    },
  );
});
