import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsPriorityChartApi } from "../Api/alarms-events-priority-chart.api";
import {
  alarmsEventsPriorityChartData,
  alarmsEventsPriorityChartTestCases,
} from "../Data/alarms-events-priority-chart.data";
import { AlarmsEventsPriorityChartMapper } from "../Mappper/alarms-events-priority-chart.mapper";
import { AlarmsEventsPriorityChartValidator } from "../Validator/alarms-events-priority-chart.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Alarms and Events - priority-wise chart", () => {
  test.setTimeout(180_000);

  for (const testCase of alarmsEventsPriorityChartTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AlarmsEventsPriorityChartApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getChart(
        testCase.params,
      );
      const assert = new AssertionEngine();
      const validate = new ValidationEngine();
      const validator = new AlarmsEventsPriorityChartValidator();

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
          alarmsEventsPriorityChartData.maxResponseTime,
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

      const data = AlarmsEventsPriorityChartMapper.map(responseBody);
      validate.execute("Zod schema", () =>
        validator.validateResponse(responseBody),
      );
      validate.execute("Priority", () =>
        validator.validatePriority(
          data,
          testCase.expectedPriority,
          testCase.expectedLabel,
        ),
      );
      validate.execute("Periods and series", () =>
        validator.validatePeriods(
          data,
          typeof testCase.params.date === "string"
            ? testCase.params.date
            : undefined,
        ),
      );
      validate.execute("No duplicate series", () =>
        validator.validateUniqueSeries(data),
      );
      validate.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Alarms and Events priority-wise chart - no login", () => {
  authTest(
    "GET /alarms-events/priority-wise/chart - missing token is rejected",
    {
      tag: [
        "@alarms-events",
        "@alarms-events-priority-chart",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(
        alarmsEventsPriorityChartData.path,
        {
          params: {
            priority: "Priority 1",
            date: alarmsEventsPriorityChartData.date,
          },
        },
      );
      const responseTime = Date.now() - startedAt;
      const responseBody = await rawResponse.json().catch(() => ({}));
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 401, responseBody),
      );
      validation.printSummary(
        "GET /alarms-events/priority-wise/chart - missing token is rejected",
        responseTime,
      );
    },
  );
});
