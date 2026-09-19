import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { AlarmsEventsChartApi } from "../Api/alarms-event-chart.api";
import {alarmsEventsChartData,alarmsEventsChartTestCases,} from "../Data/alarms-events-chart.data";
import { AlarmsEventsChartMapper } from "../Mappper/alarms-events-chart.mapper";
import { AlarmsEventsChartValidator } from "../Validator/alarms-events-chart.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Alarms and Events - Classificationchart", ()=> {
  test.setTimeout(180_000);
  for (const testCase of  alarmsEventsChartTestCases) {
    test(testCase.testName, {tag:testCase.tags}, async ({authenticatedApi}) => {
      const api = new AlarmsEventsChartApi(authenticatedApi);
      const { rawResponse,responseBody,responseTime} =  await api.getChart(testCase.params,);
      const assert = new AssertionEngine();
      const validate = new ValidationEngine();
      const validator = new AlarmsEventsChartValidator();

      validate.execute("status",()=> 
        assert.validateStatusCode(rawResponse,testCase.expectedStatus,responseBody),
      );
      validate.execute("Response Time", ()=>
        assert.validateResponseTime(responseTime,alarmsEventsChartData.maxResponseTime)
      );
      validate.execute("Content Type",()=>
        assert.validateContentType(rawResponse)
      );
      validate.execute("Sensitive Data",()=>
        assert.validateSensitiveData(responseBody),
      );
      if (testCase.expectedStatus !== 200) {
        validate.execute("Error",()=>
          validator.validateValidateError(responseBody),
        );
        validate.printSummary(testCase.testName, responseTime);
          return;
        }
        const data = AlarmsEventsChartMapper.map(responseBody);
        validate.execute("Response", () =>
          validator.validateResponse(responseBody),
        );
        validate.execute("Category", () =>
          validator.validateCategory(
            data,
            testCase.expectedSlug,
            testCase.expectedLabel,
          ),
        );
        validate.execute("Periods and phases", () =>
          validator.validatePeriods(data),
        );
        validate.printSummary(testCase.testName, responseTime);
      },
    );
    }
});
authTest.describe("Alarms and Events chart — no login", () => {
  authTest(
    "GET /alarms-events/chart — missing token is rejected",
    {
      tag: ["@alarms-events", "@alarms-events-chart", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const startedAt = Date.now();
      const rawResponse = await unauthenticatedApi.get(
        alarmsEventsChartData.path,
        {
          params: {
            category: "Power",
            date: alarmsEventsChartData.date,
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
        "GET /alarms-events/chart — missing token is rejected",
        responseTime,
      );
    },
  );
});