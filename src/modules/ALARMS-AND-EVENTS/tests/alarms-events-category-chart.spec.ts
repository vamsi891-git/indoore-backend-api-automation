import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsCategoryChartApi } from "../Api/alarms-events-category-chart.api";
import {
  alarmsEventsCategoryChartData,
  alarmsEventsCategoryChartTestCases,
} from "../Data/alarms-events-category-chart.data";
import { AlarmsEventsCategoryChartMapper } from "../Mapper/alarms-events-category-chart.mapper";
import { AlarmsEventsCategoryChartValidator } from "../Validator/alarms-events-category-chart.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Alarms and Events - category-wise chart", () => {
  test.setTimeout(180_000);

  for (const testCase of alarmsEventsCategoryChartTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AlarmsEventsCategoryChartApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getChart(testCase.params);
      const assert = new ApiValidationHelper();
      const validate = new ApiValidationHelper();
      const validator = new AlarmsEventsCategoryChartValidator();

      validate.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validate.execute("Content Type", () => assert.validateContentType(rawResponse));
      validate.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, alarmsEventsCategoryChartData.maxResponseTime),
      );
      validate.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.expectedStatus !== 200) {
        validate.execute("Error", () => validator.validateValidationError(responseBody));
        validate.printSummary(testCase.testName, responseTime);
        return;
      }

      const data = AlarmsEventsCategoryChartMapper.map(responseBody);
      validate.execute("Zod schema", () => validator.validateResponse(responseBody));
      validate.execute("Category", () =>
        validator.validateCategory(data, testCase.expectedSlug, testCase.expectedLabel),
      );
      validate.execute("Periods and consumer categories", () => validator.validatePeriods(data));
      validate.execute("No duplicate consumer categories", () =>
        validator.validateUniqueConsumerCategories(data),
      );
      validate.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Alarms and Events category-wise chart - no login", () => {
  authTest(
    "GET /alarms-events/category-wise/chart - missing token is rejected",
    {
      tag: ["@alarms-events", "@alarms-events-category-chart", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(alarmsEventsCategoryChartData.path, {
        params: {
          category: "Power",
          date: alarmsEventsCategoryChartData.date,
        },
      });
      const responseTime = Date.now() - startedAt;
      const responseBody = await rawResponse.json().catch(() => ({}));
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 401, responseBody));
      validation.printSummary(
        "GET /alarms-events/category-wise/chart - missing token is rejected",
        responseTime,
      );
    },
  );
});
