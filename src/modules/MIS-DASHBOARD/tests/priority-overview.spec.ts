import { test } from "../../../fixtures/api.fixture";
import { PriorityOverviewApi } from "../Api/priority-overview.api";
import { PriorityOverviewMapper } from "../Mapper/priority-overview.mapper";
import { PriorityOverviewValidator } from "../Validator/priority-overview.validator";
import { priorityOverviewQuery, priorityOverviewTestCases } from "../Data/priority-overview.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("How many events by urgency", () => {
  for (const testCase of priorityOverviewTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new PriorityOverviewApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getPriorityOverview(
        testCase.params,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new PriorityOverviewValidator();
      const edges = new MisDashboardEdgesValidator();

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Performance", () => assert.validateResponseTime(responseTime, 120000));
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.expectedStatus !== 200) {
        validation.execute("Error code", () => edges.validateValidationError(responseBody));
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      const data = PriorityOverviewMapper.mapPriorityOverview(responseBody.data);
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Date range", () =>
        validator.validateWindow(
          data,
          testCase.expectedFromDate,
          testCase.expectedToDate,
          testCase.expectSameDayWindow,
        ),
      );
      validation.execute("Urgency list", () => validator.validatePrioritiesExist(data));
      validation.execute("Urgency row shape", () => validator.validatePriorityStructure(data));
      validation.execute("No duplicate urgency numbers", () =>
        validator.validateUniquePriorityIds(data),
      );
      validation.execute("No duplicate urgency names", () =>
        validator.validateUniquePriorityLabels(data),
      );
      validation.execute("Urgency order", () => validator.validatePriorityOrdering(data));
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "How many events by urgency — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@priority-overview", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new PriorityOverviewApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new PriorityOverviewValidator();
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getPriorityOverview({ ...priorityOverviewQuery, assetType: "all" }),
        api.getPriorityOverview({
          ...priorityOverviewQuery,
          assetType: "consumer",
        }),
        api.getPriorityOverview({ ...priorityOverviewQuery, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = PriorityOverviewMapper.mapPriorityOverview(allResult.responseBody.data);
      const consumers = PriorityOverviewMapper.mapPriorityOverview(
        consumerResult.responseBody.data,
      );
      const dtrs = PriorityOverviewMapper.mapPriorityOverview(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "How many events by urgency — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
