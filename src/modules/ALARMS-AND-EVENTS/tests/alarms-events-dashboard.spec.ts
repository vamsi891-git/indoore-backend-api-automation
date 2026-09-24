import { test } from "../../../fixtures/api.fixture";
import { AlarmsEventsDasboardApi } from "../Api/alarms-events-dashboard.api";
import { AlarmsEventsDashboardValidator } from "../Validator/alarms-events-dashboard.validator";
import { AlarmsEventsDashboardMapper } from "../Mapper/alarms-events-dashboard.mapper";
import { alarmsEventsDashboardData } from "../Data/alarms-events-dashboard.data";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
test.describe("Alarms and Events Dashboard totals", () => {
  test(
    "GET/alarms-events/dashboard - classification totals load",
    {
      tag: ["@alams-evenst", "@alarms-events-dashboard", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const api = new AlarmsEventsDasboardApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getDashboard();
      const assert = new ApiValidationHelper();
      const validate = new ApiValidationHelper();
      const validator = new AlarmsEventsDashboardValidator();

      validate.execute("Status", () => assert.validateStatusCode(rawResponse, 200, responseBody));
      validate.execute("Content Type", () => assert.validateContentType(rawResponse));
      validate.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, alarmsEventsDashboardData.maxResponseTime),
      );
      validate.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      const data = AlarmsEventsDashboardMapper.map(responseBody);
      validate.execute("Response", () => validator.validateResponse(responseBody));
      validate.execute("Colums", () => validator.validateColums(data));
      validate.execute("counts", () => validator.validateCounts(data));
      validate.printSummary(
        "GET/alarms-events/dashboard - classification totals load",
        responseTime,
      );
    },
  );
});

authTest.describe("Alarms and Events Dashboard — no login", () => {
  authTest(
    "GET/alarms-events/dashboard - missing token is rejected",
    {
      tag: ["@alams-evenst", "@alarms-events-dashboard", "@negative"],
    },
    async ({ unauthenticatedApi }) => {
      const api = new AlarmsEventsDasboardApi(unauthenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getDashboard();
      const assert = new ApiValidationHelper();
      const validate = new ApiValidationHelper();
      validate.execute("Status", () => assert.validateStatusCode(rawResponse, 401, responseBody));
      validate.printSummary(
        "GET/alarms-events/dashboard - missing token is rejected",
        responseTime,
      );
    },
  );
});
