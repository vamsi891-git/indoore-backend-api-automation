import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsPriorityDrillApi } from "../Api/alarms-events-priority-drill.api";
import {
  alarmsEventsPriorityDrillData,
  alarmsEventsPriorityDrillTestCases,
} from "../Data/alarms-events-priority-drill.data";
import { AlarmsEventsPriorityDrillMapper } from "../Mapper/alarms-events-priority-drill.mapper";
import { AlarmsEventsPriorityDrillValidator } from "../Validator/alarms-events-priority-drill.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Alarms and Events - priority-wise drill-down", () => {
  test.setTimeout(180_000);

  for (const testCase of alarmsEventsPriorityDrillTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AlarmsEventsPriorityDrillApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getDrillDown(testCase.params);
      const assert = new ApiValidationHelper();
      const validate = new ApiValidationHelper();
      const validator = new AlarmsEventsPriorityDrillValidator();

      validate.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validate.execute("Content Type", () => assert.validateContentType(rawResponse));
      validate.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, alarmsEventsPriorityDrillData.maxResponseTime),
      );
      validate.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.expectedStatus !== 200) {
        validate.execute("Error", () => validator.validateValidationError(responseBody));
        validate.printSummary(testCase.testName, responseTime);
        return;
      }

      const data = AlarmsEventsPriorityDrillMapper.map(responseBody);
      validate.execute("Zod schema", () => validator.validateResponse(responseBody));
      validate.execute("Columns", () => validator.validateColumns(data));
      validate.execute("Context", () =>
        validator.validateContext(data, {
          expectedPrioritySlug: testCase.expectedPrioritySlug,
          expectedCategorySlug: testCase.expectedCategorySlug,
          expectedSeries: testCase.expectedSeries,
          expectedDate: testCase.expectedDate,
        }),
      );
      validate.execute("Pagination and totals", () => validator.validatePaginationAndTotals(data));
      validate.execute("Rows", () => validator.validateRows(data, testCase.expectedLabel));
      validate.execute("No duplicate columns", () => validator.validateUniqueColumns(data));
      validate.execute("No duplicate rows", () => validator.validateUniqueRows(data));
      validate.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Alarms and Events priority-wise drill-down - no login", () => {
  authTest(
    "GET /alarms-events/priority-wise/drill-down - missing token is rejected",
    {
      tag: ["@alarms-events", "@alarms-events-priority-drill", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(alarmsEventsPriorityDrillData.path, {
        params: {
          priority: "Resolved",
          category: "Power",
          date: alarmsEventsPriorityDrillData.date,
          series: alarmsEventsPriorityDrillData.series,
        },
      });
      const responseTime = Date.now() - startedAt;
      const responseBody = await rawResponse.json().catch(() => ({}));
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 401, responseBody));
      validation.printSummary(
        "GET /alarms-events/priority-wise/drill-down - missing token is rejected",
        responseTime,
      );
    },
  );
});
