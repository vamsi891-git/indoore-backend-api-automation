import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsCategoryDrillApi } from "../Api/alarms-events-category-drill.api";
import {
  alarmsEventsCategoryDrillData,
  alarmsEventsCategoryDrillTestCases,
} from "../Data/alarms-events-category-drill.data";
import { AlarmsEventsCategoryDrillMapper } from "../Mapper/alarms-events-category-drill.mapper";
import { AlarmsEventsCategoryDrillValidator } from "../Validator/alarms-events-category-drill.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Alarms and Events - category-wise drill-down", () => {
  test.setTimeout(180_000);

  for (const testCase of alarmsEventsCategoryDrillTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AlarmsEventsCategoryDrillApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getDrillDown(testCase.params);
      const assert = new ApiValidationHelper();
      const validate = new ApiValidationHelper();
      const validator = new AlarmsEventsCategoryDrillValidator();

      validate.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validate.execute("Content Type", () => assert.validateContentType(rawResponse));
      validate.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, alarmsEventsCategoryDrillData.maxResponseTime),
      );
      validate.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.expectedStatus !== 200) {
        validate.execute("Error", () => validator.validateValidationError(responseBody));
        validate.printSummary(testCase.testName, responseTime);
        return;
      }

      const data = AlarmsEventsCategoryDrillMapper.map(responseBody);
      validate.execute("Zod schema", () => validator.validateResponse(responseBody));
      validate.execute("Columns", () => validator.validateColumns(data));
      validate.execute("Context", () =>
        validator.validateContext(data, testCase.expectedSlug, testCase.expectedSeries),
      );
      validate.execute("Pagination and totals", () => validator.validatePaginationAndTotals(data));
      validate.execute("Rows", () => validator.validateRows(data, testCase.expectedLabel));
      validate.execute("No duplicate columns", () => validator.validateUniqueColumns(data));
      validate.execute("No duplicate rows", () => validator.validateUniqueRows(data));
      validate.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Alarms and Events category-wise drill-down - no login", () => {
  authTest(
    "GET /alarms-events/category-wise/drill-down - missing token is rejected",
    {
      tag: ["@alarms-events", "@alarms-events-category-drill", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(alarmsEventsCategoryDrillData.path, {
        params: {
          category: "Power",
          date: alarmsEventsCategoryDrillData.date,
          series: alarmsEventsCategoryDrillData.series,
        },
      });
      const responseTime = Date.now() - startedAt;
      const responseBody = await rawResponse.json().catch(() => ({}));
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 401, responseBody));
      validation.printSummary(
        "GET /alarms-events/category-wise/drill-down - missing token is rejected",
        responseTime,
      );
    },
  );
});
