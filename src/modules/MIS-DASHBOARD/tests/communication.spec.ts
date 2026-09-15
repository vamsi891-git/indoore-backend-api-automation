import { test } from "../../../fixtures/api.fixture";
import { CommStatsApi } from "../Api/communication.api";
import { CommStatsMapper } from "../Mapper/communication.mapper";
import { CommStatsValidator } from "../Validator/communication.validator";
import { communicationTestCases } from "../Data/communication.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("How meters are talking", () => {
  for (const testCase of communicationTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new CommStatsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getCommStats(
        testCase.params,
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommStatsValidator();
      const edges = new MisDashboardEdgesValidator();

      validation.execute("Status", () =>
        assert.validateStatusCode(
          rawResponse,
          testCase.expectedStatus,
          responseBody,
        ),
      );
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Performance", () =>
        assert.validateResponseTime(responseTime, 120000),
      );
      validation.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );

      if (testCase.expectedStatus !== 200) {
        validation.execute("Error code", () =>
          edges.validateValidationError(responseBody),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Response", () => validator.validateResponse(responseBody));
      const data = CommStatsMapper.mapCommStats(responseBody.data);
      validation.execute("Date range", () =>
        validator.validateWindow(
          data,
          testCase.expectedFromDate,
          testCase.expectedToDate,
          testCase.expectSameDayWindow,
        ),
      );
      validation.execute("Talking vs not talking adds up", () =>
        validator.validateOverall(data),
      );
      validation.execute("Category list", () => validator.validateCategories(data));
      if (testCase.checkExpectedLabels !== false) {
        validation.execute("Expected category names", () =>
          validator.validateExpectedCategoryLabels(data),
        );
      }
      validation.execute("No duplicate category names", () =>
        validator.validateUniqueCategoryLabels(data),
      );
      if (testCase.checkChartMembership !== false) {
        validation.execute("Category counts match talking meters", () =>
          validator.validateCategoryCountsMatchCommunicating(data),
        );
      }
      validation.execute("Meter type list", () => validator.validatePhases(data));
      if (testCase.checkExpectedLabels !== false) {
        validation.execute("Expected meter type names", () =>
          validator.validateExpectedPhaseLabels(data),
        );
      }
      validation.execute("No duplicate meter type names", () =>
        validator.validateUniquePhaseLabels(data),
      );
      if (testCase.checkChartMembership !== false) {
        validation.execute("Meter type counts match talking meters", () =>
          validator.validatePhaseCountsMatchCommunicating(data),
        );
      }
      validation.execute("Daily trend", () => validator.validateTrend(data));
      validation.execute("No duplicate trend dates", () =>
        validator.validateUniqueTrendDates(data),
      );
      validation.execute("One trend point for every day in the range", () =>
        validator.validateTrendMatchesWindow(data),
      );
      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
