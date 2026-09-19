import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsPhaseDrillApi } from "../Api/alarms-events-phase-drill.api";
import {
  alarmsEventsPhaseDrillData,
  alarmsEventsPhaseDrillTestCases,
} from "../Data/alarms-events-phase-drill.data";
import { AlarmsEventsPhaseDrillMapper } from "../Mappper/alarms-events-phase-drill.mapper";
import { AlarmsEventsPhaseDrillValidator } from "../Validator/alarms-events-phase-drill.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Alarms and Events — phase-wise drill-down", () => {
  test.setTimeout(180_000);

  for (const testCase of alarmsEventsPhaseDrillTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AlarmsEventsPhaseDrillApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getDrillDown(testCase.params);
      const assert = new AssertionEngine();
      const validate = new ValidationEngine();
      const validator = new AlarmsEventsPhaseDrillValidator();

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
          alarmsEventsPhaseDrillData.maxResponseTime,
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

      const data = AlarmsEventsPhaseDrillMapper.map(responseBody);
      validate.execute("Zod schema", () =>
        validator.validateResponse(responseBody),
      );
      validate.execute("Columns", () => validator.validateColumns(data));
      validate.execute("Context", () =>
        validator.validateContext(
          data,
          testCase.expectedSlug,
          testCase.expectedSeries,
        ),
      );
      validate.execute("Pagination and totals", () =>
        validator.validatePaginationAndTotals(data),
      );
      validate.execute("Rows", () =>
        validator.validateRows(data, testCase.expectedLabel),
      );
      validate.execute("No duplicate columns", () =>
        validator.validateUniqueColumns(data),
      );
      validate.execute("No duplicate rows", () =>
        validator.validateUniqueRows(data),
      );
      validate.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Alarms and Events phase drill-down — no login", () => {
  authTest(
    "GET /alarms-events/phase-wise/drill-down — missing token is rejected",
    {
      tag: ["@alarms-events", "@alarms-events-phase-drill", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(
        alarmsEventsPhaseDrillData.path,
        {
          params: {
            category: "Power",
            date: alarmsEventsPhaseDrillData.date,
            series: alarmsEventsPhaseDrillData.series,
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
        "GET /alarms-events/phase-wise/drill-down — missing token is rejected",
        responseTime,
      );
    },
  );
});