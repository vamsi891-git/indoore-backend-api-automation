import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsPriorityWiseApi } from "../Api/alarms-events-priority-wise.api";
import {
  alarmsEventsPriorityWiseData,
  alarmsEventsPriorityWiseTestCases,
} from "../Data/alarms-events-priority-wise.data";
import { AlarmsEventsPriorityWiseMapper } from "../Mapper/alarms-events-priority-wise.mapper";
import { AlarmsEventsPriorityWiseValidator } from "../Validator/alarms-events-priority-wise.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Alarms and Events - priority-wise", () => {
  test.setTimeout(180_000);

  for (const testCase of alarmsEventsPriorityWiseTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new AlarmsEventsPriorityWiseApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getPriorityWise(
        testCase.params,
      );
      const assert = new ApiValidationHelper();
      const validate = new ApiValidationHelper();
      const validator = new AlarmsEventsPriorityWiseValidator();

      validate.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validate.execute("Content Type", () => assert.validateContentType(rawResponse));
      validate.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, alarmsEventsPriorityWiseData.maxResponseTime),
      );
      validate.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.expectedStatus !== 200) {
        validate.execute("Error", () => validator.validateValidationError(responseBody));
        validate.printSummary(testCase.testName, responseTime);
        return;
      }

      const data = AlarmsEventsPriorityWiseMapper.map(responseBody);
      validate.execute("Zod schema", () => validator.validateResponse(responseBody));
      validate.execute("Dates", () => validator.validateDates(data, testCase.expectedCurrentDate));
      validate.execute("Columns", () => validator.validateColumns(data));
      validate.execute("Expected priorities", () =>
        validator.validateExpectedPriorities(data, testCase.expectedPriorityIds),
      );
      validate.execute("No duplicate priorities", () => validator.validateUniquePriorities(data));
      validate.execute("Totals", () => validator.validateTotals(data));
      validate.printSummary(testCase.testName, responseTime);
    });
  }
});

authTest.describe("Alarms and Events priority-wise - no login", () => {
  authTest(
    "GET /alarms-events/priority-wise - missing token is rejected",
    {
      tag: ["@alarms-events", "@alarms-events-priority-wise", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(alarmsEventsPriorityWiseData.path);
      const responseTime = Date.now() - startedAt;
      const responseBody = await rawResponse.json().catch(() => ({}));
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 401, responseBody));
      validation.printSummary(
        "GET /alarms-events/priority-wise - missing token is rejected",
        responseTime,
      );
    },
  );
});
